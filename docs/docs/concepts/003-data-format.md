# Streaming Protocol

To enable streaming of both text and UI, Crayon uses a standard
streaming protocol as described here:

### Text Part
`0:<text>`

### Response Template Part
`1:{name: <name>, templateProps: <templateProps>}`

### Context Part
`8:{context}`
