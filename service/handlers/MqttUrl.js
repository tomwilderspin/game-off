import createSignedUrl from 'aws-device-gateway-signed-url'

const secretKey = process.env.SECRET
const accessKey = process.env.KEY

export const run = (event, context, cb) => {
  const url = createSignedUrl({
    regionName: 'eu-west-1',
    endpoint: 'a2mitcx60xh2d5-ats.iot.eu-west-1.amazonaws.com',
    secretKey,
    accessKey,
    expires: 1800
  })
  console.log(event)
  return cb(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({ message: 'hello world', url })
  })
}
