use blog_shared::{config::SmtpConfig, AppError};
use lettre::{
    message::{header::ContentType, Mailbox, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};
use uuid::Uuid;
use serde_json::json;

#[derive(Clone)]
pub struct EmailService {
    mailer: SmtpTransport,
    from: Mailbox,
}

impl EmailService {
    pub fn new(config: &SmtpConfig) -> Result<Self, AppError> {
        // 解析邮箱地址，提供更详细的错误信息
        let from_addr = config.from.parse().map_err(|e| {
            tracing::error!("Invalid from email address '{}': {}", config.from, e);
            AppError::InternalError
        })?;

        let from = Mailbox::new(None, from_addr);

        // 创建凭据
        let creds = Credentials::new(config.username.clone(), config.password.clone());

        // 构建 SMTP 传输
        let mailer = if config.tls {
            SmtpTransport::relay(&config.host)
                .map_err(|e| {
                    tracing::error!("Failed to create SMTP transport with TLS for host '{}': {}", config.host, e);
                    AppError::InternalError
                })?
                .port(config.port)
                .credentials(creds)
                .build()
        } else {
            // 使用 builder_dangerous 用于开发环境（不验证证书）
            SmtpTransport::builder_dangerous(&config.host)
                .port(config.port)
                .credentials(creds)
                .build()
        };

        tracing::info!("EmailService initialized with SMTP host: {}:{} (TLS: {})", config.host, config.port, config.tls);

        Ok(Self { mailer, from })
    }

    /// 发送邮箱验证邮件
    pub async fn send_verification_email(
        &self,
        to: &str,
        user_id: &Uuid,
    ) -> Result<(), AppError> {
        let verification_token = self.generate_verification_token(user_id);
        let verification_url = format!("https://yourdomain.com/verify-email?token={}", verification_token);

        let email_body = self.render_verification_email_template(&verification_url)?;

        let email = Message::builder()
            .from(self.from.clone())
            .to(to.parse().map_err(|e| {
                tracing::error!("Invalid to email address: {}", e);
                AppError::InternalError
            })?)
            .subject("Please verify your email address")
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(self.render_verification_email_text(&verification_url)),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(email_body),
                    ),
            )
            .map_err(|e| {
                tracing::error!("Failed to build email: {}", e);
                AppError::InternalError
            })?;

        self.send_email(email).await
    }

    /// 发送密码重置邮件
    pub async fn send_password_reset_email(
        &self,
        to: &str,
        reset_token: &str,
    ) -> Result<(), AppError> {
        let reset_url = format!("https://yourdomain.com/reset-password?token={}", reset_token);

        let email = Message::builder()
            .from(self.from.clone())
            .to(to.parse().map_err(|e| {
                tracing::error!("Invalid to email address: {}", e);
                AppError::InternalError
            })?)
            .subject("Reset your password")
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(self.render_password_reset_email_text(&reset_url)),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(self.render_password_reset_email_html(&reset_url)),
                    ),
            )
            .map_err(|e| {
                tracing::error!("Failed to build email: {}", e);
                AppError::InternalError
            })?;

        self.send_email(email).await
    }

    /// 发送评论通知邮件
    pub async fn send_comment_notification_email(
        &self,
        to: &str,
        author_name: &str,
        post_title: &str,
        comment_content: &str,
        comment_url: &str,
    ) -> Result<(), AppError> {
        let email = Message::builder()
            .from(self.from.clone())
            .to(to.parse().map_err(|e| {
                tracing::error!("Invalid to email address: {}", e);
                AppError::InternalError
            })?)
            .subject(format!("New comment on \"{}\"", post_title))
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(self.render_comment_notification_text(
                                author_name,
                                post_title,
                                comment_content,
                                comment_url,
                            )),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(self.render_comment_notification_html(
                                author_name,
                                post_title,
                                comment_content,
                                comment_url,
                            )),
                    ),
            )
            .map_err(|e| {
                tracing::error!("Failed to build email: {}", e);
                AppError::InternalError
            })?;

        self.send_email(email).await
    }

    /// 发送邮件的通用方法
    async fn send_email(&self, email: Message) -> Result<(), AppError> {
        let mailer = self.mailer.clone();

        // 在单独的线程中同步发送邮件
        tokio::task::spawn_blocking(move || {
            match mailer.send(&email) {
                Ok(_) => {
                    tracing::info!("Email sent successfully");
                }
                Err(e) => {
                    tracing::error!("Failed to send email: {}", e);
                }
            }
        });

        Ok(())
    }

    /// 生成验证令牌
    fn generate_verification_token(&self, user_id: &Uuid) -> String {
        use base64::{Engine as _, engine::general_purpose};
        let token_data = json!({
            "user_id": user_id,
            "timestamp": chrono::Utc::now().timestamp(),
            "type": "email_verification"
        });
        general_purpose::STANDARD.encode(token_data.to_string())
    }

    /// 渲染验证邮件模板（HTML）
    fn render_verification_email_template(&self, verification_url: &str) -> Result<String, AppError> {
        let html = format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email Address</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }}
    </style>
</head>
<body>
    <h2>Welcome to Our Blog!</h2>
    <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>

    <a href="{verification_url}" class="button">Verify Email Address</a>

    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p>{verification_url}</p>

    <p>This link will expire in 24 hours.</p>

    <div class="footer">
        <p>If you didn't sign up for this account, you can safely ignore this email.</p>
    </div>
</body>
</html>
"#
        );
        Ok(html)
    }

    /// 渲染验证邮件模板（纯文本）
    fn render_verification_email_text(&self, verification_url: &str) -> String {
        format!(
            r#"
Welcome to Our Blog!

Thank you for signing up. To complete your registration, please visit this link to verify your email address:

{verification_url}

This link will expire in 24 hours.

If you didn't sign up for this account, you can safely ignore this email.
"#
        )
    }

    /// 渲染密码重置邮件模板（纯文本）
    fn render_password_reset_email_text(&self, reset_url: &str) -> String {
        format!(
            r#"
Password Reset Request

You requested to reset your password. Click the link below to set a new password:

{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
"#
        )
    }

    /// 渲染密码重置邮件模板（HTML）
    fn render_password_reset_email_html(&self, reset_url: &str) -> String {
        format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #dc3545;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }}
    </style>
</head>
<body>
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Click the button below to set a new password:</p>

    <a href="{reset_url}" class="button">Reset Password</a>

    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p>{reset_url}</p>

    <p>This link will expire in 1 hour.</p>

    <div class="footer">
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
</body>
</html>
"#
        )
    }

    /// 渲染评论通知邮件模板（纯文本）
    fn render_comment_notification_text(
        &self,
        author_name: &str,
        post_title: &str,
        comment_content: &str,
        comment_url: &str,
    ) -> String {
        format!(
            r#"
New Comment on Your Post

{author_name} commented on your post "{post_title}":

"{comment_content}"

View the comment here: {comment_url}

---
This is an automated notification. You can disable email notifications in your settings.
"#
        )
    }

    /// 渲染评论通知邮件模板（HTML）
    fn render_comment_notification_html(
        &self,
        author_name: &str,
        post_title: &str,
        comment_content: &str,
        comment_url: &str,
    ) -> String {
        format!(
            r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Comment</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .comment {{
            background-color: #f5f5f5;
            padding: 15px;
            border-left: 3px solid #007bff;
            margin: 20px 0;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }}
    </style>
</head>
<body>
    <h2>New Comment on Your Post</h2>
    <p><strong>{author_name}</strong> commented on your post <strong>"{post_title}"</strong></p>

    <div class="comment">
        <p>{comment_content}</p>
    </div>

    <a href="{comment_url}" class="button">View Comment</a>

    <div class="footer">
        <p>This is an automated notification. You can disable email notifications in your settings.</p>
    </div>
</body>
</html>
"#
        )
    }
}

// 添加必要的依赖到 core/Cargo.toml
use base64;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification_token_generation() {
        let service = EmailService::new(&SmtpConfig {
            host: "localhost".to_string(),
            port: 587,
            username: "test".to_string(),
            password: "test".to_string(),
            from: "test@example.com".to_string(),
            tls: false,
        }).unwrap();

        let user_id = Uuid::new_v4();
        let token = service.generate_verification_token(&user_id);

        assert!(!token.is_empty());
        assert!(token.len() > 10);
    }
}