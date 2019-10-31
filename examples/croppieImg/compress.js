function compress(img, Orientation) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // 小图片的 canvas
  const smallCanvas = document.createElement('canvas');
  // const smallCtx = smallCanvas.getContext('2d');
  // 原图宽 高
  let {
    width,
    height
  } = img;

  // 如果图片大于2百万像素，计算压缩比并将大小压至200万以下
  let ratio = width * height / 4000000;
  if (ratio > 1) {
    ratio = Math.sqrt(ratio);
    width /= ratio;
    height /= ratio;
  } else {
    ratio = 1;
  }

  canvas.width = width;
  canvas.height = height;

  // 直接将图片限制为200万， 不做瓦片， 方便旋转图片
  // let count = width * height / 1000000;
  // if (count > 1) {
  //   // 计算要分成多少块瓦片
  //   count = parseInt(Math.sqrt(count) + 1, 10);

  //   // 计算每块瓦片的宽和高
  //   const nw = parseInt(width / count, 10);
  //   const nh = parseInt(height / count, 10);

  //   smallCanvas.width = nw;
  //   smallCanvas.height = nh;

  //   for (let i = 0; i < count; i += 1) {
  //     for (let j = 0; j < count; j += 1) {
  //       smallCtx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
  //       ctx.drawImage(smallCanvas, i * nw, j * nh, nw, nh);
  //     }
  //   }
  // } else {
  //   ctx.drawImage(img, 0, 0, width, height);
  // }
  ctx.fillStyle = '#fff';
  if (Orientation && Orientation !== 1) {
    switch (Orientation) {
      case 6: // 旋转90度
        canvas.width = height;
        canvas.height = width;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.rotate(Math.PI / 2);
        // (0,-imgHeight) 从旋转原理图那里获得的起始点
        ctx.drawImage(img, 0, -height, width, height);
        break;
      case 3: // 旋转180度
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, -width, -height, width, height);
        break;
      case 8: // 旋转-90度
        canvas.width = height;
        canvas.height = width;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.rotate(3 * Math.PI / 2);
        ctx.drawImage(img, -width, 0, width, height);
        break;
      default:
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
    }
  } else {
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, width, height);
  }

  // 进行最小压缩
  const ndata = canvas.toDataURL('image/jpeg', 0.7);
  /* eslint-disable-next-line */
  smallCanvas.width = smallCanvas.height = canvas.width = canvas.height = 0;
  return ndata;
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  /* eslint-disable-next-line */
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// export default { compress, dataURLtoFile };
