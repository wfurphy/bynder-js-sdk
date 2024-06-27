# Bynder JavaScript SDK

![Tests](https://github.com/Bynder/bynder-js-sdk/workflows/Tests/badge.svg)
![Publish](https://github.com/Bynder/bynder-js-sdk/workflows/Publish/badge.svg)

This SDK aims to help the development of integrations with
[Bynder](https://www.bynder.com/en/) that use JavaScript, providing an easy
interface to communicate with
[Bynder's REST API](https://developer-docs.bynder.com/API/).

## Requirements

To use this SDK, you will need:

- [Node.js **v6.3.0 or above**](https://nodejs.org/)

Node installation will include [NPM](https://www.npmjs.com/), which is
responsible for dependency management.

## Installation

### Node.js

`npm install @bynder/bynder-js-sdk`

`import Bynder from '@bynder/bynder-js-sdk';`

## Usage

This SDK relies heavily on [Promises](https://developers.google.com/web/fundamentals/getting-started/primers/promises),
making it easier to handle the asynchronous requests made to the API. The SDK
provides a `Bynder` object containing several methods which map to the
calls and parameters described in
[Bynder's API documentation](http://docs.bynder.apiary.io/).

The following snippet is a generic example of how to use the SDK. If you need
details for a specific module, refer to the
[samples folder](https://github.com/Bynder/bynder-js-sdk/tree/master/samples).

Before executing any request, you need to authorize the calls to the API:


### Using a permanent token
```js
const bynder = new Bynder({
  baseURL: "https//<your-portal>.getbynder.com/api/",
  permanentToken: "<token>",
});
```

### Using OAuth2

Follow the steps for the **grant type** you configured for the OAuth2 app in Bynder. If you're unsure which grant type you should use you can review [this article](https://support.bynder.com/hc/en-us/articles/360013875180-Create-your-OAuth-Apps#UUID-aa268404-6dbe-05ea-04d8-79fc250d9f98_section-idm232162628742675) for more information.

> :warning:	_Use a secrets file, environment variables or a secrets management service to populate your credentials. Don't ever include them in your codebase and git repository._

#### Authorization Code + Refresh Token

The most common flow where a user is directed to Bynder to login and then redirected back to the url you supplied to continue in your application.

```js
// Call the constructor with your credentials
const bynder = new Bynder({
  baseURL: "https://<your-portal>.getbynder.com/api/",
  clientId: "<your OAuth2 client id>",
  clientSecret: "<your OAuth2 client secret>",
  redirectUri: "<url where user will be redirected after authenticating>"
});
// Create an authorization URL, send the user to login and get a one-time authorization code
const authorizationURL = bynder.makeAuthorizationURL();
```
Once the user has logged in they will be redirected to your Redirect URL and from there:

```js
// Collect the code from the URL however you choose, for example:
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('login_challenge');
// Exchange that code for an access token
bynder.getToken(code);
```

#### Client Credentials

This flow is most commonly used for machine to machine integrations. You specify the user that this app acts as when configuting the OAuth2 app in Bynder.

```js
// Call the constructor with your credentials
const bynder = new Bynder({
  baseURL: "https://<your-portal>.getbynder.com/api/",
  clientId: "<your OAuth2 client id>",
  clientSecret: "<your OAuth2 client secret>",
});
// Get an access token
bynder.getToken();
```
#### Already have an access token?

If you already have an access token, you can also initialize Bynder with the
token directly:

```js
const bynder = new Bynder({
  baseURL: "http://api-url.bynder.io/api/",
  clientId: "<your OAuth2 client id>",
  clientSecret: "<your OAuth2 client secret>",
  redirectUri: "<url where user will be redirected after authenticating>",
  token: "<OAuth2 access token>"
});
```

#### Making requests

You can now use the various methods from the SDK to fetch media, metaproperties
and other data. Following the Promises notation, you should use
`.then()`/`.catch()` to handle the successful and failed requests,
respectively.

Most of the calls take an object as the only parameter but please refer to the
API documentation to tune the query as intended.

```js
bynder
  .getMediaList({
    type: "image",
    limit: 9,
    page: 1
  })
  .then(data => {
    // TODO Handle data
  })
  .catch(error => {
    // TODO Handle the error
  });
```

## Available methods

### Authentication

- `makeAuthorizationURL()`
- `getToken()`

### Media

- `getMediaList(queryObject)`
- `getMediaInfo(queryObject)`
- `getAllMediaItems(queryObject)`
- `getMediaTotal(queryObject)`
- `editMedia(object)`
- `deleteMedia(id)`

### Media usage

- `getAssetUsage(queryObject)`
- `saveNewAssetUsage(queryObject)`
- `deleteAssetUsage(queryObject)`

### Metaproperties

- `getMetaproperties(queryObject)`
- `getMetaproperty(queryObject)`
- `saveNewMetaproperty(object)`
- `editMetaproperty(object)`
- `deleteMetaproperty(object)`
- `saveNewMetapropertyOption(object)`
- `editMetapropertyOption(object)`
- `deleteMetapropertyOption(object)`

### Collections

- `getCollections(queryObject)`
- `getCollection(queryObject)`
- `saveNewCollection(queryObject)`
- `shareCollection(queryObject)`
- `addMediaToCollection(queryObject)`
- `deleteMediaFromCollection(queryObject)`

### Tags

- `getTags(queryObject)`

### Smartfilters

- `getSmartfilters(queryObject)`

### Brands

- `getBrands()`

### Upload

- `uploadFile(fileObject)`

## Contribute to the SDK

If you wish to contribute to this repository and further extend the API coverage in the SDK, here
are the steps necessary to prepare your environment:

1. Clone the repository
2. In the root folder, run `yarn install` to install all of the dependencies.
3. Create a `secret.json` file with the following structure:

```json
{
  "baseURL": "http://api-url.bynder.io/api/",
  "clientId": "<your OAuth2 client id>",
  "clientSecret": "<your OAuth2 client secret>",
  "redirectUri": "<url where user will be redirected after authenticating>"
}
```

4. The following gulp tasks are available:

- `gulp lint` - Run ESlint and check the code.
- `gulp build` - Run webpack to bundle the code in order to run in a browser.
- `gulp babel` - Run Babel to create a folder 'dist' with ES2015 compatible code.
- `gulp doc` - Run JSDoc to create a 'doc' folder with automatically generated documentation for the source code.
- `gulp webserver` - Deploy a web server from the root folder at
  `localhost:8080` to run the html samples (in order to avoid CORS problems).
