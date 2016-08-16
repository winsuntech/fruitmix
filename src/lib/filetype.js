import child from 'child_process'

let filepath = 'nothing.dot'


const fileDetect = (filepath, callback) => {

  child.exec(`file ${filepath} -b -m magic/animation:magic/audio:magic/images`, (err, stdout, stderr) => {
    console.log(err)
    console.log(stdout.toString().trim())
    console.log(stdout.toString().length)
  })
}


