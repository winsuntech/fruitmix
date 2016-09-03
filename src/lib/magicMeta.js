export default (magic) => {

  let meta = {}
  if (magic.startsWith('JPEG image data')) {
    meta.type = 'JPEG'

    // remove exif bracket and split
    let items = magic.replace(/\[.*\]/g, '').split(',').map(item => item.trim())

    // find width x height
    let x = items.find(item => /^\d+x\d+$/.test(item))
    if (!x) return null
  
    let y = x.split('x')
    meta.width = parseInt(y[0])
    meta.height = parseInt(y[1])

    if (items.find(item => item === 'Exif Standard:')) {
      meta.extended = true
    }
    else {
      meta.extended = false
    }

    return meta // type = JPEG, width, height, extended
  }
  return null
}


