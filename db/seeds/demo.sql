INSERT INTO service_checks (
  name,
  url,
  icon,
  group_name,
  enabled,
  check_path,
  expected_status,
  public_url,
  link_label,
  check_level,
  api_config,
  script_content
)
VALUES
  (
    'NEXUS Harbor Demo',
    'http://demo-web.internal.example',
    'layout',
    'web',
    TRUE,
    '/',
    200,
    'https://harbor-demo.example.com',
    '打开演示',
    1,
    NULL,
    NULL
  ),
  (
    'OpenClaw Gateway Demo',
    'http://demo-gateway.internal.example',
    'gateway',
    'core',
    TRUE,
    '/health',
    200,
    'https://gateway-demo.example.com',
    '查看状态',
    2,
    '{"endpoint":"/health","method":"GET"}'::jsonb,
    NULL
  ),
  (
    'Search Demo Service',
    'http://demo-search.internal.example',
    'search',
    'api',
    TRUE,
    '/search',
    200,
    'https://search-demo.example.com',
    '访问搜索',
    1,
    NULL,
    NULL
  )
ON CONFLICT DO NOTHING;
