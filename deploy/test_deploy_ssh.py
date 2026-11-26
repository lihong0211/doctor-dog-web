"""Run the server portion of deploy.sh against a local Git SSH transport."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("deploy.sh")


class DeploySSHTest(unittest.TestCase):
    def test_pull_preserves_repository_identity_and_known_hosts(self):
        self.check_pull(configured=True)

    def test_pull_works_with_default_ssh(self):
        self.check_pull(configured=False)

    def check_pull(self, configured):
        with tempfile.TemporaryDirectory(prefix="deploy-ssh-") as directory:
            root = Path(directory)
            repo = root / "checkout"
            origin = root / "origin.git"
            bin_dir = root / "bin"
            bin_dir.mkdir()
            env = dict(os.environ, PATH=f"{bin_dir}:{os.environ['PATH']}",
                       GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                       SSH_LOG=str(root / "ssh.log"), NGINX_LOG=str(root / "nginx.log"))
            for key in ("GIT_SSH_COMMAND", "GIT_SSH", "GIT_DIR", "GIT_WORK_TREE"):
                env.pop(key, None)

            def git(*args):
                return subprocess.run(["git", *args], env=env, check=True,
                                      capture_output=True, text=True).stdout

            git("init", "--bare", str(origin))
            git("clone", str(origin), str(repo))
            git("-C", str(repo), "config", "user.name", "Deploy Test")
            git("-C", str(repo), "config", "user.email", "deploy@example.test")
            (repo / "version").write_text("first\n")
            git("-C", str(repo), "add", "version")
            git("-C", str(repo), "commit", "-m", "initial")
            git("-C", str(repo), "push", "-u", "origin", "HEAD")
            branch = git("-C", str(repo), "branch", "--show-current").strip()
            initial = git("-C", str(repo), "rev-parse", "HEAD").strip()
            (repo / "version").write_text("second\n")
            git("-C", str(repo), "commit", "-am", "update")
            git("-C", str(repo), "push")
            git("-C", str(repo), "checkout", "-B", "deployed", initial)
            git("-C", str(repo), "branch", f"--set-upstream-to=origin/{branch}")

            # Replace only the network transport; Git still fetches and merges.
            ssh = bin_dir / "ssh"
            ssh.write_text('#!/bin/bash\nprintf "%s\\n" "$@" >> "$SSH_LOG"\n'
                           'for arg in "$@"; do last="$arg"; done\nexec sh -c "$last"\n')
            ssh.chmod(0o755)
            nginx = bin_dir / "nginx"
            nginx.write_text('#!/bin/bash\nprintf "%s\\n" "$*" >> "$NGINX_LOG"\n')
            nginx.chmod(0o755)
            git("-C", str(repo), "remote", "set-url", "origin",
                f"ssh://git@ssh.github.com:443{origin}")
            if configured:
                git("-C", str(repo), "config", "core.sshCommand",
                    "ssh -i /root/doctor-dog-deploy/id_ed25519 "
                    "-o IdentitiesOnly=yes "
                    "-o UserKnownHostsFile=/root/doctor-dog-deploy/known_hosts")

            body = SCRIPT.read_text().split("<<REMOTE_SCRIPT\n", 1)[1].split("\nREMOTE_SCRIPT", 1)[0]
            env["DEPLOY_PATH"] = str(repo)
            expanded = subprocess.check_output(
                ["bash", "-c", "cat <<REMOTE_SCRIPT\n" + body + "\nREMOTE_SCRIPT"], env=env)
            result = subprocess.run(["bash"], input=expanded, env=env, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            self.assertEqual((repo / "version").read_text(), "second\n")
            args = (root / "ssh.log").read_text()
            self.assertIn("BatchMode=yes", args)
            self.assertIn("ConnectTimeout=", args)
            if configured:
                self.assertIn("/root/doctor-dog-deploy/id_ed25519", args)
                self.assertIn("UserKnownHostsFile=/root/doctor-dog-deploy/known_hosts", args)
            self.assertIn("-s reload", (root / "nginx.log").read_text())


if __name__ == "__main__":
    unittest.main()
