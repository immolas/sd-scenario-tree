# install.py
import launch

if not launch.is_installed("parsimonious"):
    launch.run_pip("install parsimonious==1.2.3", "requirements sd-scenario-tree")
