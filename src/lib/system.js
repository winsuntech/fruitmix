
let avail = true

const sysAvail = (req, res, next) => avail ? next() : res.status(503).end()  

export { sysAvail }

