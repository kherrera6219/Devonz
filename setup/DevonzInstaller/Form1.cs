using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;
using System.Threading.Tasks;

namespace DevonzInstaller
{
    public partial class Form1 : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Button installButton;
        private TextBox pathTextBox;
        private string targetPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Devonz");

        public Form1()
        {
            InitializeComponent();
            SetupUI();
        }

        private void SetupUI()
        {
            this.Text = "Devonz Setup Wizard";
            this.Size = new System.Drawing.Size(500, 300);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterScreen;

            statusLabel = new Label() { Text = "Select installation folder:", Top = 20, Left = 20, Width = 400 };
            pathTextBox = new TextBox() { Text = targetPath, Top = 50, Left = 20, Width = 350 };
            var browseButton = new Button() { Text = "Browse...", Top = 48, Left = 380, Width = 80 };
            browseButton.Click += (s, e) => {
                using (var fbd = new FolderBrowserDialog()) {
                    if (fbd.ShowDialog() == DialogResult.OK) pathTextBox.Text = fbd.SelectedPath;
                }
            };

            progressBar = new ProgressBar() { Top = 120, Left = 20, Width = 440, Height = 30, Visible = false };
            installButton = new Button() { Text = "Install", Top = 180, Left = 190, Width = 100, Height = 40 };
            installButton.Click += async (s, e) => await StartInstallation();

            this.Controls.Add(statusLabel);
            this.Controls.Add(pathTextBox);
            this.Controls.Add(browseButton);
            this.Controls.Add(progressBar);
            this.Controls.Add(installButton);
        }

        private async Task StartInstallation()
        {
            targetPath = pathTextBox.Text;
            installButton.Enabled = false;
            progressBar.Visible = true;
            statusLabel.Text = "Installing Devonz...";

            try
            {
                await Task.Run(() => {
                    if (Directory.Exists(targetPath)) Directory.Delete(targetPath, true);
                    Directory.CreateDirectory(targetPath);

                    var assembly = Assembly.GetExecutingAssembly();
                    using (Stream stream = assembly.GetManifestResourceStream("DevonzInstaller.payload.zip"))
                    {
                        if (stream == null) throw new Exception("Payload not found!");
                        using (ZipArchive archive = new ZipArchive(stream))
                        {
                            int count = 0;
                            foreach (ZipArchiveEntry entry in archive.Entries)
                            {
                                string fullPath = Path.Combine(targetPath, entry.FullName);
                                if (string.IsNullOrEmpty(entry.Name)) Directory.CreateDirectory(fullPath);
                                else {
                                    Directory.CreateDirectory(Path.GetDirectoryName(fullPath));
                                    entry.ExtractToFile(fullPath, true);
                                }
                                count++;
                                this.Invoke((Action)(() => progressBar.Value = (int)((double)count / archive.Entries.Count * 100)));
                            }
                        }
                    }
                    CreateShortcut();
                });

                statusLabel.Text = "Installation Complete!";
                MessageBox.Show("Devonz has been installed successfully.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error: " + ex.Message, "Installation Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
                installButton.Enabled = true;
            }
        }

        private void CreateShortcut()
        {
            string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string shortcutPath = Path.Combine(desktopPath, "Devonz.lnk");
            string appPath = Path.Combine(targetPath, "app_launcher.exe");

            // Simple PowerShell command to create a shortcut
            string psCommand = $"$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{shortcutPath}'); $s.TargetPath='{appPath}'; $s.Save()";
            Process.Start(new ProcessStartInfo("powershell", $"-Command \"{psCommand}\"") { CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden });
        }
    }
}
