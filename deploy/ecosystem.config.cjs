// PM2 process for the Next.js standalone server.
// One instance in fork mode on purpose: Next's cache ('use cache' + updateTag)
// lives in this process, so a second instance would serve stale content.
const ROOT = process.env.APP_ROOT || "/var/www/mora";

module.exports = {
  apps: [
    {
      name: "mora",
      // `current` is a symlink to the active release (see deploy.sh).
      cwd: `${ROOT}/current/.next/standalone`,
      script: "server.js",
      node_args: `--env-file=${ROOT}/shared/.env`,
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production", PORT: "3000", HOSTNAME: "127.0.0.1" },
      max_memory_restart: "800M",
      kill_timeout: 10000,
      time: true,
      out_file: `${ROOT}/logs/app.out.log`,
      error_file: `${ROOT}/logs/app.err.log`,
    },
  ],
};
