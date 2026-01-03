import re
import json

# 从之前的输出中解析模块
module_data = """
depth:7|path:./frontend/src/app/admin/posts/show/[slug]|files:2|types:[md,tsx]|has_claude:yes
depth:7|path:./frontend/src/app/tags/[tag]/page/[page]|files:2|types:[md,tsx]|has_claude:yes
depth:6|path:./frontend/src/app/admin/monitoring/health|files:2|types:[md,tsx]|has_claude:yes
depth:6|path:./frontend/src/app/admin/monitoring/metrics|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./backend/crates/api/src/metrics|files:3|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/src/middleware|files:4|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/src/routes|files:15|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/src/utils|files:2|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/e2e|files:3|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/helpers|files:3|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/security|files:2|types:[rs]|has_claude:no
depth:5|path:./backend/crates/api/tests/unit|files:6|types:[rs]|has_claude:no
depth:5|path:./backend/crates/db/src/models|files:1|types:[rs]|has_claude:no
depth:5|path:./backend/crates/shared/src/middleware|files:2|types:[rs]|has_claude:no
depth:5|path:./frontend/src/app/admin/analytics|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/comments|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/monitoring|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/posts|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/posts-refine|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/posts-simple|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/settings|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/test|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/users|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/admin/users-refine|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/api/newsletter|files:2|types:[md,ts]|has_claude:yes
depth:5|path:./frontend/src/app/api/visitor|files:2|types:[md,ts]|has_claude:yes
depth:5|path:./frontend/src/app/api/visitors|files:2|types:[md,ts]|has_claude:yes
depth:5|path:./frontend/src/app/music/[name]|files:3|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/app/tags/[tag]|files:2|types:[md,tsx]|has_claude:yes
depth:5|path:./frontend/src/components/media/Image|files:2|types:[md]|has_claude:yes
depth:5|path:./frontend/src/components/navigation/TableOfContents|files:6|types:[tsx,ts]|has_claude:no
depth:5|path:./frontend/src/components/shadcn/ui|files:14|types:[tsx]|has_claude:no
depth:5|path:./frontend/src/components/ui/Skeleton|files:3|types:[tsx,md]|has_claude:no
depth:5|path:./frontend/src/components/ui/Toast|files:1|types:[md]|has_claude:no
depth:5|path:./frontend/src/lib/store/core|files:4|types:[ts,md]|has_claude:yes
depth:4|path:./backend/crates/api/src|files:5|types:[rs]|has_claude:no
depth:4|path:./backend/crates/api/tests|files:10|types:[rs]|has_claude:no
depth:4|path:./backend/crates/core/src|files:3|types:[rs]|has_claude:no
depth:4|path:./backend/crates/db/src|files:2|types:[rs]|has_claude:no
depth:4|path:./backend/crates/shared/src|files:6|types:[rs]|has_claude:no
depth:4|path:./backend/crates/worker/src|files:1|types:[rs]|has_claude:no
depth:4|path:./docs/deployment/guides/docker|files:5|types:[md]|has_claude:no
depth:4|path:./docs/deployment/guides/low-resource|files:4|types:[md]|has_claude:no
depth:4|path:./docs/deployment/guides/scripts|files:1|types:[md]|has_claude:no
depth:4|path:./docs/deployment/guides/server|files:5|types:[md]|has_claude:no
depth:4|path:./docs/development/guides/backend-development|files:1|types:[md]|has_claude:no
depth:4|path:./docs/development/guides/frontend-development|files:1|types:[md]|has_claude:no
depth:4|path:./docs/development/guides/testing|files:2|types:[md]|has_claude:no
depth:4|path:./frontend/src/app/about|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/admin|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/analytics|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/excalidraw|files:3|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/experiment|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/music|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/offline|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/projects|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/simple-test|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/tags|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/app/visitors|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/admin|files:6|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/animations|files:18|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/audio|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/auth|files:4|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/book|files:5|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/charts|files:7|types:[tsx,ts]|has_claude:no
depth:4|path:./frontend/src/components/chemistry|files:7|types:[tsx,ts]|has_claude:no
depth:4|path:./frontend/src/components/debug|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/Excalidraw|files:2|types:[css,tsx]|has_claude:no
depth:4|path:./frontend/src/components/header|files:6|types:[tsx,md]|has_claude:no
depth:4|path:./frontend/src/components/home|files:4|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/hooks|files:10|types:[ts]|has_claude:no
depth:4|path:./frontend/src/components/layouts|files:10|types:[tsx,md]|has_claude:yes
depth:4|path:./frontend/src/components/lib|files:2|types:[md,ts]|has_claude:yes
depth:4|path:./frontend/src/components/loaders|files:11|types:[tsx,md,ts]|has_claude:yes
depth:4|path:./frontend/src/components/magazine|files:9|types:[tsx,md]|has_claude:yes
depth:4|path:./frontend/src/components/maps|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/MDXComponents|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/post|files:6|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/search|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/sections|files:11|types:[tsx,css]|has_claude:no
depth:4|path:./frontend/src/components/seo|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/social-icons|files:2|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/three|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/components/ui|files:7|types:[tsx]|has_claude:no
depth:4|path:./frontend/src/lib/api|files:2|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/cache|files:3|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/db|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/hooks|files:4|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/providers|files:4|types:[tsx,ts]|has_claude:no
depth:4|path:./frontend/src/lib/security|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/store|files:7|types:[ts,md]|has_claude:no
depth:4|path:./frontend/src/lib/types|files:5|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/ui|files:1|types:[ts]|has_claude:no
depth:4|path:./frontend/src/lib/utils|files:22|types:[ts]|has_claude:no
depth:4|path:./frontend/src/payload/collections|files:6|types:[ts]|has_claude:no
depth:4|path:./frontend/tests/app/admin|files:4|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/lib/providers|files:5|types:[ts,tsx]|has_claude:no
depth:4|path:./frontend/tests/lib/security|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/lib/utils|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-3dmol|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-api|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-chemistry|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-chemistry-debug|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-health-page|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-molecule-id|files:1|types:[tsx]|has_claude:no
depth:4|path:./frontend/tests/routes/test-rkit-mol|files:1|types:[tsx]|has_claude:no
depth:3|path:./backend/crates/api|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/core|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/db|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/shared|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/crates/worker|files:1|types:[toml]|has_claude:no
depth:3|path:./backend/scripts/data|files:7|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/database|files:2|types:[sh,sql]|has_claude:no
depth:3|path:./backend/scripts/deployment|files:3|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/development|files:3|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/openapi|files:1|types:[sh]|has_claude:no
depth:3|path:./backend/scripts/testing|files:7|types:[ps1,sh]|has_claude:no
depth:3|path:./docs/deployment/archive|files:5|types:[md]|has_claude:no
depth:3|path:./docs/deployment/best-practices|files:5|types:[md]|has_claude:no
depth:3|path:./docs/deployment/concepts|files:4|types:[md]|has_claude:no
depth:3|path:./docs/deployment/getting-started|files:4|types:[md]|has_claude:no
depth:3|path:./docs/deployment/guides|files:1|types:[md]|has_claude:no
depth:3|path:./docs/deployment/reference|files:6|types:[md]|has_claude:no
depth:3|path:./docs/development/archive|files:7|types:[md]|has_claude:no
depth:3|path:./docs/development/best-practices|files:5|types:[md]|has_claude:no
depth:3|path:./docs/development/concepts|files:3|types:[md]|has_claude:no
depth:3|path:./docs/development/getting-started|files:2|types:[md]|has_claude:no
depth:3|path:./docs/development/operations|files:3|types:[md]|has_claude:no
depth:3|path:./docs/development/reference|files:2|types:[md]|has_claude:no
depth:3|path:./docs/guides/technical|files:3|types:[md]|has_claude:no
depth:3|path:./frontend/data/authors|files:1|types:[mdx]|has_claude:no
depth:3|path:./frontend/scripts/dev|files:2|types:[bat,sh]|has_claude:no
depth:3|path:./frontend/scripts/generate|files:4|types:[js,sh,mjs]|has_claude:no
depth:3|path:./frontend/scripts/test|files:3|types:[ps1,sh]|has_claude:no
depth:3|path:./frontend/src/app|files:11|types:[tsx,ts,json]|has_claude:no
depth:3|path:./frontend/src/components|files:73|types:[tsx,css]|has_claude:no
depth:3|path:./frontend/src/lib|files:16|types:[ts,tsx]|has_claude:no
depth:3|path:./frontend/src/mocks|files:2|types:[ts]|has_claude:no
depth:3|path:./frontend/src/styles|files:2|types:[css]|has_claude:no
depth:3|path:./frontend/styles/tokens|files:3|types:[css]|has_claude:no
depth:2|path:./backend/.cargo|files:1|types:[toml]|has_claude:no
depth:2|path:./backend/.sqlx|files:59|types:[json,toml]|has_claude:no
depth:2|path:./backend/migrations|files:9|types:[sql]|has_claude:no
depth:2|path:./backend/openapi|files:1|types:[json]|has_claude:no
depth:2|path:./backend/scripts|files:10|types:[ps1,sh]|has_claude:no
depth:2|path:./docs/appendix|files:3|types:[md]|has_claude:no
depth:2|path:./docs/archive|files:1|types:[md]|has_claude:no
depth:2|path:./docs/configuration|files:1|types:[md]|has_claude:no
depth:2|path:./docs/deployment|files:3|types:[md]|has_claude:no
depth:2|path:./docs/development|files:3|types:[md]|has_claude:no
depth:2|path:./docs/getting-started|files:9|types:[md]|has_claude:no
depth:2|path:./docs/guides|files:6|types:[md]|has_claude:no
depth:2|path:./docs/migration|files:1|types:[md]|has_claude:no
depth:2|path:./docs/operations|files:3|types:[md]|has_claude:no
depth:2|path:./docs/reference|files:4|types:[md,json]|has_claude:no
depth:2|path:./docs/testing|files:8|types:[md]|has_claude:no
depth:2|path:./frontend/data|files:9|types:[ts,svg,bib,js]|has_claude:no
depth:2|path:./frontend/e2e|files:4|types:[ts]|has_claude:no
depth:2|path:./frontend/scripts|files:8|types:[js]|has_claude:no
depth:2|path:./frontend/src|files:1|types:[bak]|has_claude:no
depth:2|path:./frontend/tests|files:8|types:[js,bat,md,ts,html]|has_claude:no
depth:2|path:./frontend/types|files:7|types:[ts]|has_claude:no
depth:2|path:./scripts/archive|files:2|types:[py,sh]|has_claude:no
depth:2|path:./scripts/backup|files:2|types:[sh]|has_claude:no
depth:2|path:./scripts/data|files:4|types:[mjs]|has_claude:no
depth:2|path:./scripts/deployment|files:20|types:[ps1,sh,js]|has_claude:no
depth:2|path:./scripts/dev|files:6|types:[bat,sh,ps1]|has_claude:no
depth:2|path:./scripts/export|files:2|types:[py,sh]|has_claude:no
depth:2|path:./scripts/operations|files:4|types:[sh]|has_claude:no
depth:2|path:./scripts/testing|files:3|types:[ps1]|has_claude:no
depth:2|path:./scripts/utils|files:9|types:[sh,py,mjs,js]|has_claude:no
depth:1|path:./backend|files:12|types:[example,lock,toml,md,bat]|has_claude:no
depth:1|path:./docs|files:4|types:[md]|has_claude:no
depth:1|path:./frontend|files:23|types:[local,json,ts,curl-only,md,js,bak,yaml,tsbuildinfo]|has_claude:no
depth:1|path:./scripts|files:9|types:[nu,ps1,sh,md]|has_claude:no
depth:0|path:.|files:12|types:[sh,bat,json,js,md]|has_claude:no
"""

# 解析模块
modules = []
for line in module_data.strip().split('\n'):
    match = re.match(r'depth:(\d+)\|path:([^\|]+)\|files:(\d+)\|types:\[([^\]]*)\]\|has_claude:(yes|no)', line)
    if match:
        depth, path, files, types, has_claude = match.groups()
        modules.append({
            'depth': int(depth),
            'path': path.replace('./', ''),
            'files': int(files),
            'types': types.split(','),
            'has_claude': has_claude == 'yes'
        })

# 过滤规则
skip_patterns = [
    r'/tests?/',
    r'/e2e/',
    r'/test/',
    r'/deployments/',
    r'\.github/workflows',
    r'/archive/',
    r'/images/',
    r'/videos/',
    r'/snippets/',
    r'/locales/',
    r'/export/',
    r'\.tar$',
    r'/config/',
    r'/environments/',
    r'\.husky',
    r'/slidev/',
]

def should_skip(path):
    for pattern in skip_patterns:
        if re.search(pattern, path):
            return True
    return False

# 过滤并分组
filtered = [m for m in modules if not should_skip(m['path'])]
layers = {3: [], 2: [], 1: []}
for m in filtered:
    if m['depth'] >= 3:
        layers[3].append(m)
    elif m['depth'] >= 1:
        layers[2].append(m)
    else:
        layers[1].append(m)

# 输出结果
result = {
    'total': len(filtered),
    'layers': {
        'layer3': len(layers[3]),
        'layer2': len(layers[2]),
        'layer1': len(layers[1])
    },
    'layer3_paths': [m['path'] for m in layers[3]],
    'layer2_paths': [m['path'] for m in layers[2]],
    'layer1_paths': [m['path'] for m in layers[1]]
}

print(json.dumps(result, indent=2))
