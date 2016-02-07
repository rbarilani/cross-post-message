cross-post-message
==================

Experiments with post message api cross domain.

### Usage

#### Hub

```html
<!-- http://hub-domain.com/hub -->

<script type="text/javascript" src="/vendor/cross-post-message/dist/hub.js"></script>
<script type="text/javascript">
var hub = new CrossPostMessageHub({ allowedOrigins: ['http://client-domain.com'] });

hub.when('GET', '/info', function (request, resolve /*, reject */) {
  resolve('foo'); // or resolve({status: 200, body: 'foo'})
});
</script>
```


#### Client

```html
<!-- http://client-domain.com -->

<script type="text/javascript" src="/vendor/cross-post-message/dist/client.js"></script>
<script type="text/javascript">
  var client = new CrossPostMessageClient('http://hub-domain.com/hub');

  client.on('ready', function () {
    client
      .request({ method: 'GET',  uri: '/info' })
      .then(function (response) {
        console.log('success', response.body); // OUTPUT: foo 
      })
      .catch(function (response) {
        console.error(response);
      });
  });

  client.on('response', function (response) {
    console.log('response to request: ' + response.request.id , response);
  });
</script>
```
