# Cargo Configuration

## Module Overview

Rust-specific toolchain and compiler configuration for the backend application.

## Purpose

Configure Cargo (Rust package manager) behavior, compiler flags, and target-specific settings.

## Structure

```
backend/.cargo/
└── config.toml    # Cargo configuration file
```

## Configuration File

### Location
`backend/.cargo/config.toml`

### Purpose
Project-level Cargo configuration that overrides global/user settings.

## Current Configuration

### Windows Target Configuration

```toml
[target.'cfg(windows)']
rustflags = ["-C", "link-args=/STACK:8000000"]
```

**Purpose**: Increase stack size for Windows builds

**Details**:
- **Flag**: `/STACK:8000000`
- **Size**: 8 MB (default is usually 1-2 MB)
- **Reason**: Prevent stack overflow in recursive operations or deep call chains

### Why This Configuration?

**Stack Size Issues**:
- Recursive descent parsing for MDX
- Deep JSON serialization/deserialization
- Complex async task chains
- Database query builder recursion

**Alternative Solutions**:
- Increase heap allocation usage
- Refactor recursive algorithms to iterative
- Use `Box` to move data to heap
- Configure per-thread stack size

## Configuration Options

### Available Settings

#### Compiler Flags (`rustflags`)
```toml
rustflags = ["-C", "opt-level=3"]  # Optimization level
rustflags = ["-C", "target-cpu=native"]  # CPU-specific optimizations
```

#### Target Settings
```toml
[target.x86_64-unknown-linux-gnu]
rustflags = ["-C", "link-arg=-fuse-ld=lld"]  # Use lld linker

[target.aarch64-apple-darwin]
rustflags = ["-C", "link-arg=-fuse-ld=ld64"]  # Use ld64 linker
```

#### Build Settings
```toml
[build]
target = "x86_64-unknown-linux-gnu"
jobs = 4  # Parallel jobs
```

#### Registry Configuration
```toml
[registry]
default = "sparse+https://index.crates.io/"
```

#### Net Configuration (for dependencies)
```toml
[net]
git-fetch-with-cli = true
```

## Common Configurations

### Development Configuration
```toml
[profile.dev]
opt-level = 0  # No optimization for faster compilation
debug = true
incremental = true
```

### Release Configuration
```toml
[profile.release]
opt-level = 3  # Maximum optimization
lto = true  # Link-time optimization
codegen-units = 1  # Better optimization at cost of compile time
strip = true  # Remove debug symbols
```

### Test Configuration
```toml
[profile.test]
opt-level = 1  # Light optimization
```

## Environment-Specific Configuration

### Linux
```toml
[target.'cfg(target_os = "linux")']
rustflags = ["-C", "link-arg=-Wl,--as-needed"]
```

### macOS
```toml
[target.'cfg(target_os = "macos")']
rustflags = ["-C", "link-arg=-undefined", "dynamic_lookup"]
```

### Windows
```toml
[target.'cfg(windows)']
rustflags = ["-C", "link-args=/STACK:8000000"]
```

## Dependency Configuration

### Source Replacement (for local development)
```toml
[source.crates-io]
replace-with = "local"

[source.local]
path = "/path/to/local/registry"
```

### Patch Dependencies (for git dependencies)
```toml
[patch.crates-io]
dependency-name = { path = "../local/path" }
```

## Build Scripts

### Conditional Compilation
```rust
#[cfg(target_os = "windows")]
{
    // Windows-specific code
}

#[cfg(target_os = "linux")]
{
    // Linux-specific code
}
```

## Toolchain Management

### Rustup Override
```bash
# Set toolchain per directory
rustup override set stable

# Set specific version
rustup override set 1.75.0
```

### Toolchain File (`rust-toolchain.toml`)
```toml
[toolchain]
channel = "1.75.0"
components = ["rustfmt", "clippy"]
```

## Performance Tuning

### Compilation Speed
```toml
[profile.dev]
incremental = true
codegen-units = 256  # More parallelism
```

### Runtime Performance
```toml
[profile.release]
opt-level = 3
lto = "fat"  # Full link-time optimization
panic = "abort"  # Reduce binary size
```

### Binary Size
```toml
[profile.release]
opt-level = "z"  # Optimize for size
lto = true
strip = true
codegen-units = 1
```

## Cross-Compilation

### Linux to Windows
```bash
rustup target add x86_64-pc-windows-gnu
cargo build --target x86_64-pc-windows-gnu
```

### Configuration
```toml
[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"
ar = "x86_64-w64-mingw32-gcc-ar"
```

## Troubleshooting

### Stack Overflow Errors
**Symptom**: `thread 'main' has overflowed its stack`

**Solution**: Increase stack size (current configuration)
```toml
[target.'cfg(windows)']
rustflags = ["-C", "link-args=/STACK:16000000"]  # 16 MB
```

### Linker Errors
**Symptom**: `linking with cc failed`

**Solutions**:
- Install C build tools
- Configure linker explicitly
- Use `cargo install cargo-xwin` for cross-compilation

### Slow Compilation
**Solutions**:
- Use `incremental = true`
- Reduce `codegen-units` in dev
- Enable molder (Linux linker)
- Use sccache for distributed caching

## Best Practices

### Project Configuration
- Keep `.cargo/config.toml` in version control
- Document target-specific configurations
- Test cross-platform builds regularly

### Development Workflow
- Use `[profile.dev]` for faster iteration
- Use `[profile.release]` for production
- Run `cargo clippy` before committing
- Format code with `cargo fmt`

### Build Optimization
- Profile before optimizing
- Use `cargo flamegraph` for hotspot analysis
- Benchmark with `cargo criterion`
- Test optimizations with real workloads

## Integration with SQLx

### Offline Mode Support
The `.sqlx/config.toml` file (sibling directory) enables offline mode:
```toml
[general]
offline = true
```

This works alongside Cargo configuration to support offline development.

## Related Modules

- **Backend Source**: `../src/` - Application code
- **SQLx Config**: `../.sqlx/` - Database query cache
- **Migrations**: `../migrations/` - Database schema
- **Cargo.toml**: `../Cargo.toml` - Dependencies

## Resources

- [Cargo Configuration Documentation](https://doc.rust-lang.org/cargo/reference/config.html)
- [Rust Compiler Options](https://doc.rust-lang.org/rustc/codegen-options/index.html)
- [Cross-Compilation Guide](https://rust-lang.github.io/rustup/cross-compilation.html)

---

**Last Updated**: 2026-01-03
**Maintained By**: Backend Team
