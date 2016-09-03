import { expect } from 'chai'
import magicMeta from 'src/lib/magicMeta'

describe('test magic meta for a JPEG with exif', function() {
  it('should parse a magic from a JPEG image from a SONY phone (xperia xa)', function() {
    let magic = 'JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, Exif Standard: [TIFF image data, little-endian, direntries=18, description=, manufacturer=Sony, model=F3116, orientation=upper-right, xresolution=326, yresolution=334, resolutionunit=2, software=MediaTek Camera Application, datetime=2016:07:19 15:44:47], baseline, precision 8, 4096x2304, frames 3'

    let meta = magicMeta(magic)
    expect(meta.type).to.equal('JPEG')
    expect(meta.width).to.equal(4096)
    expect(meta.height).to.equal(2304)
    expect(meta.extended).to.be.true
  })
})

describe('test magic meta for JPEGs w/o exif', function() {
  it('should parse an sample data', function() {
    let magic = 'JPEG image data, JFIF standard 1.01, resolution (DPI), density 72x72, segment length 16, baseline, precision 8, 160x94, frames 3'
  
    let meta = magicMeta(magic)
    expect(meta.type).to.equal('JPEG')
    expect(meta.width).to.equal(160)
    expect(meta.height).to.equal(94)
    expect(meta.extended).to.be.false
  })
})
