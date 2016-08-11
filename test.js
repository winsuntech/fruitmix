
function hello(path, callback) {
  if (path) callback(new Error('i am error'))
  else callback(null, 'world')
}

function doSomething() {

  hello('quick', (err, result) => {
    console.log(err)
    console.log(result)
  })

  console.log('this is divider -----------------')

  hello(null, (err, result) => {
    console.log(err)
    console.log(result)
  })
}

doSomething()
