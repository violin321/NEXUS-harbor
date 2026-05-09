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
    'NEXUS Harbor Compose App',
    'http://app:3000',
    'layout',
    'web',
    TRUE,
    '/api/health',
    200,
    'http://localhost:3000',
    '打开演示',
    2,
    '{"endpoint":"/api/health","method":"GET","response_path":"status","expected_value":"ok"}'::jsonb,
    NULL
  )
ON CONFLICT DO NOTHING;
