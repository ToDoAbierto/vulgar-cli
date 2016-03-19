[![Dependency Status](https://david-dm.org/datatypevoid/vulgar-cli.svg)](https://david-dm.org/datatypevoid/vulgar-cli) [![Build Status](https://travis-ci.org/datatypevoid/vulgar-cli.svg?branch=master)](https://travis-ci.org/datatypevoid/vulgar-cli) [![GitHub release](https://img.shields.io/github/release/qubyte/rubidium.svg)](https://github.com/datatypevoid/vulgar-cli) [![Issue Stats](http://issuestats.com/github/datatypevoid/generator-vulgar/badge/pr?style=flat)](http://issuestats.com/github/datatypevoid/vulgar-cli) [![Issue Stats](http://issuestats.com/github/datatypevoid/vulgar-cli/badge/issue?style=flat)](http://issuestats.com/github/datatypevoid/vulgar-cli) [![Stack Share](http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](stackshare.io/datatypevoid/vulgar)

# V#!g@r Command Line [![Join Slack](https://img.shields.io/badge/slack-join-brightgreen.svg)](http://www.davidniciforovic.com/wp-login.php?action=slack-invitation)

## *Currently in active development*

Source for npm package `vulgar`. `vulgar-cli` is a core package of the `vulgar.io` project and is used primarily to deploy and manage full-stack web applications developed using `MEAN` technologies.

The `cli` currently provides the functionality to deploy a fresh copy of a `MEAN` application as well as assist you in creating the initial admin account. Automated dependency installation is also an option.

See <https://github.com/datatypevoid/vulgar> for more in-depth information about the `v#!g@r` flavor of `MEAN` stack.

## Quick start

```bash
# install global prerequisite
$ npm install -f generator-vulgar

# create a new mean app
$ vulgar init <nameOfApplication>

# add required global libraries
$ npm install -g typings webpack-dev-server concurrently

# install the repo with npm
# (if you declined automated dependency installation in the wizard)
$ npm install

# build code
$ npm run build

# start up the stack

# this command runs two commands in parallel via `concurrently`:
# `npm run server` starts up `webpack-dev-server` allowing for
# hot module reloading
# `npm` run watch` uses `webpack` to watch the necessary files
# and build on file change
$ npm start

# in a separate terminal:
# start `Express` server
$ gulp serve
```

go to <http://0.0.0.0:8080> or <http://localhost:8080> in your browser

## Basic Usage

### Explore CLI functionality:

```
$ vulgar --help
```

### Create a New MEAN app:

```
$ vulgar init <NameOfYourApp>
```

### Generate a Routable Angular Component on the Front-end

You can generate a new Angular route via the following command (note the singular used in `nyan`):

```bash
$ vulgar scaffold ngr nyan
```

The `cli` will prompt the user to select the parent module, confirm the name for their newly minted routable `Angular` component, as well as define the`Angular` route `path` for the children components.

This will create a folder with a routable component (`nyan-root.component.ts`) with two sub-routes. The file structure will be as follows:

```
...
|-- app
|   |-- nyan
|   |   |-- nyan-detail.component.html
|   |   |-- nyan-detail.component.sass
|   |   |-- nyan-detail.component.spec.ts
|   |   |-- nyan-detail.component.ts
|   |   |-- nyan-list.component.html
|   |   |-- nyan-list.component.sass
|   |   |-- nyan-list.component.spec.ts
|   |   |-- nyan-list.component.ts
|   |   |-- nyan-root.component.spec.ts
|   |   |-- nyan-root.component.ts
|   |   |-- nyan.service.spec.ts
|   |   |-- nyan.service.ts
|   |-- ...
|-- app.ts
...
```

Afterwards to use the new route open your main app component, import `nyan-root.component.ts` and add it in the route config:

```
@RouteConfig([
  {path:'/nyan/...', name: 'NyanRoot', component: NyanRoot}
])
```

Visiting `http://localhost:8080/nyan` will show the `nyan` list.

## Other Commands

  Install Dependencies:

```
$ cd <NameOfYourApp> && npm install
```

Build Code

```
$ npm run build
```

Start Server

```
$ gulp serve
```

Watch & Bundle Front-End With Webpack

```
$ npm run watch
```

Hot Module Reloading for Front-End Via Webpack

```
$ npm run server:dev:hmr
```

## Contributing

Contributions are welcome but they myst clearly demonstrate a new concept in accordance with the Angular 2 Style Guide. Come join the discussion on Slack and help guide development.

# Support, Questions, or Feedback

> Contact us anytime for anything about this repo, Angular 2, or MEAN stack development in general.

- [Twitter: @datatype_void](https://twitter.com/datatype_void)

--------------------------------------------------------------------------------

enjoy -- **Da5id**

<br><br>

> Looking for corporate Angular/MEAN training, want to host us, or Angular/MEAN consulting? david.r.niciforovic@gmail.com

# License

 [MIT](/LICENSE)
