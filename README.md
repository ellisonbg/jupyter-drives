# jupyter_drives

[![Github Actions Status](https://github.com/QuantStack/jupyter-drives/workflows/Build/badge.svg)](https://github.com/QuantStack/jupyter-drives/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/QuantStack/jupyter-drives/main?urlpath=lab)
A Jupyter extension to support drives in the backend.

This extension is composed of a Python package named `jupyter_drives`
for the server extension and a NPM package named `@jupyter/drives`
for the frontend extension.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyter_drives
```

## Configure Credentials

To begin using the extension and gain access to your drives, you need to configure your user credentials generated by the provider (e.g.: `access_key`, `secret-access-key` and if applicable `session_token`).

For those working with `S3` drives using the `AWS` CLI, the credentials will be automatically extracted from `~/.aws/credentials`. There is nothing that needs to be done on your side.

> Note: This is only applicable for Linux or macOS `AWS` [CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html) users. In case you are using the `AWS` CLI from Windows, you can use the custom file path configuration with `C:\Users\USERNAME\.aws\credentials`. You can read more about this [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

### Configuration file

Otherwise, you can add your credentials to the server configuration file. Create a `jupyter_notebook_config.py` file in one of the
[Jupyter config directories](https://jupyter.readthedocs.io/en/latest/use/jupyter-directories.html#id1),
for example: `~/.jupyter/jupyter_notebook_config.py`, and specify your long-term or short-term credentials.

```python
c = get_config()

c.DrivesConfig.access_key_id = "<AWS Access Key ID / IAM Access Key ID>"
c.DrivesConfig.secret_access_key = "<AWS Secret Access Key / IAM Secret>"
c.DrivesConfig.session_token = "<AWS Session Token / IAM Session Token>"
```

### Custom credentials file path 

You can also just specify the location of a local file which contains your credentials. The `acccess_key`, `secret_access_key` and if applicable the `session_token` will be automatically extracted from there.

```python
c = get_config()

c.DrivesConfig.custom_credentials_path = "path/to/file/containing/credentials"
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyter_drives
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyter_drives directory
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyter_drives
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyter_drives
pip uninstall jupyter_drives
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `@jupyter/drives` within that folder.

### Testing the extension

#### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
# Each time you install the Python package, you need to restore the front-end extension link
jupyter labextension develop . --overwrite
```

To execute them, run:

```sh
pytest -vv -r ap --cov jupyter_drives
```

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
