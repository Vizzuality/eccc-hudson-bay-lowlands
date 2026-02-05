# Science Template and Guidelines

Template and guidelines for generating the structure of a python project for Vizzuality's science team.

This template is basically a copy of running

```
uv init --package data-processing
```

plus some common folders for notebooks and data, linting rules and pre-commit configurations. The same result could be achieved by running the `uv init` command and copying the `pyproject.toml` and `.pre-commit-config.yml` files and creating `data`, `tests` and `notebooks` folders.

## Set up

> [!TIP]
> Each project has its particular needs. Review that everything here is suited and makes sense for them.

### Use the template

If you want to use this template specifically, then clone this repo to the destination project folder with the next command. Note the destination folder here is
assumed to be `data-processing` but it can be anything else.

```
git clone --depth=1 git@github.com:Vizzuality/science-folder-template.git data-processing
```

then delete the .git folder from inside the freshly cloned folder with the command:

> [!NOTE]
> This step only applies if the template is used to create a folder inside another repository.

```
rm -rf data-processing/.git
```

### `uv` package management

This template assumes the use of `uv`.

Add runtime packages with `uv add {pkg name}`. Add packages used only in development (like tests or linting) with `uv add --dev {pkg name}`.

### python version

The python version used is controlled by the `.python-version` file and the `requires-python = ...` field in `pyproject.toml`.

### `pre-commit`

pre-commit hooks are just a little nudge to keep cleaner repositories.

In order to install the pre-commits hooks defined in `.pre-commit-config.yaml` run

```
uvx pre-commit install
```

The hooks included are a mix of python linting and general tidiness.
