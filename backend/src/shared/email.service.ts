import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { LOGO_BASE64 } from './logo-base64.js';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  if (!to) return false;
  try {
    const info = await transporter.sendMail({
      from: ENV.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Logo embebido en Base64 para que funcione en todos los clientes de correo
const TRUCK_LOGO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAoAAAAKACAYAAAAMzckjAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAIABJREFUeJzt3Xm4rndd3/v3XiQhA8gQkhBmgjIXBUVEKAhYCxVO0VoQAm1FtEcrqFXD8WrPcaqtWtSjHrmqp4IHWhHbOhTEGdQyCA6gMipKgkwimCgkTJJ1/rj3JpudPazheZ7f8zz363Vd69rJ3it7ffLsvb7rs36/+/7dR3Z3dwMAYD52RgcAAGC1FEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZkYBBACYGQUQAGBmFEAAgJlRAAEAZuas0QFYuCPVXat7H/3xLtUdq4urC4++nVudU10wJiLAJ11bfaz6SPWBo2/vq95RXVX9efXm6u3V7qCMsHWO7O76fNpwt6secvTtgdXfq24+NBHA4v1t9YbqtdUrq1dV7x6aCDaYArh5blY9vHrM0bd7jI0DMMxbqpdWv1z9VtNKIrAHCuBmOKv6B9UTqsdXtxwbB2DtXF39fPUz1a9Xfzc2Dqw3BXC93aG6vPra6k6DswBsivdUz69+vOkaQuAECuB6emj1zOpLq5sMzgKwqa6vXlb9cPXiwVlgrSiA6+Wx1bdVnzM6CMCWeU31nU3XDMLsKYDr4VHVd1cPGh0EYMu9uvo31ctHB4GRFMCxLq2+t3rq6CAAM/OSpuur/2J0EBjBk0DGOKv6+qYjDJQ/gNV7bNMB09/edDA+zIoVwNV7aPWcpgObARjvD5tWA181OgisihXA1blJ03eav5XyB7BOPrN6RfVD1dmDs8BKWAFcjUuq/1J94eggAJzWb1VPzmPm2HJWAJfvUdXrU/4ANsHDm2b2o0cHgWVSAJdnp+mol1+rbjs4CwB7d1H1i03nBh4ZnAWWwhbwcpxbPa/68tFBADiU/1I9rfr46CCwSArg4t2m6XwphzoDbIeXVv+0um50EFgUBXCxLmna8nWXL8B2eW31xdX7RweBRVAAF+eO1W9UnzE6CABL8abqH1bvHB0EDksBXIyLm44OuOfoIAAs1Z82Hej/vtFB4DDcBXx4t6lelvIHMAefUb24utnoIHAYCuDhnFf9z+o+o4MAsDKfW/1cniHMBlMAD26n6XiAB48OAsDKfWH13HwdZUP5i3tw31V96egQAAxzefVto0PAQbgJ5GAe3XRKvAINMG/XV4+pfnV0ENgPBXD/blu9Lo93A2Dyvur+1btHB4G9soK1Pzep/mvKHwA3uLj6qaavEbARFMD9+c7qkaNDALB2Hl79n6NDwF7ZAt67hzYd9qw0A3Ay11cPq145Ogg4UwHcm7Oq36s+c3QQANbaW6vPqj4yOgiciQK4N8+sfnB0CAA2wpnGSdT0ufs9TU9KOufYT7oGcG8+N+UPYO/ONE6i/vnoAGygX+m4f1AA9+bfTg+HgGWZ6zipJW6V2mZOcV++OzRta33STvXAVj/Z7rEBhwz9MPfZ0r8mfuH0r5l9mOOfe+P11Udf3qn3hxl/Tj47k5H/nqwv89b1KcdzP2IfH+PUv/Fn74z8u3PyF22e29g/1fTF9uT/KxvuN08ddjucV/3x6ff0VuWWdY/qmac/7RfY7o4uZKs6vfYDh/hA23FunlRdWd3u+F+wBXx6/+zoAsAy3Sw3xHGDOXxOnNBnbAGf3nO6fqf6t6tOAuxpK5TN45+BGTA/VmdXAdyP6+o/VI9eVRCART+qDbZx+JgfK/eC6o0n/qQCuH+/0j0cWAAH4CkDq+AcQHZXeOj6Lz4oQI+q/nT1cQAOYXc3P/PrOnRl33wOz8i/M+YtP3f0LRjvJ0/1i1YA9++hTYtvJ/viyb4Fd7v2B2e+M/vx25N9vMO/D2dw7q9x5o+3X0dXFX799K9/8ud3F6fSVvXBhYHZ/l4O+bny+uqV5T9TlueX+kcnO/JFAdy/s6sXVl948iffcHdPfe/A+V8gvnjYbk/r0Z88+T/Pf5weYwrg3l1aPf9Uv3i6b0CufDH/fO81ACgz21F/b/UP+v7qw8c+d2IB/ML+2x/OkpYH2V//sRu74XA5ubdUD6ie3gqfE79M59xud+f8n/7i/7/3VEO9vv7o/9Xu7qWVp4ewUOv2Obi7u3vp9LD4/d1OcvU//s/d37+7RVoAPnmH1puu//YP7F70T8vKHzC30mPhnqxf/OGdI0cuur789uX/VH3B0wZ8zHb/tEuu/pP+5FtHhAG2zKo+Jw55DeD1u0dv//jYl/+z6orvGxAG2Dr7OLF/0fR/AJuZaXjfZ/+xWyOwtc53DeC+vefaP++Hqp+qO40KA2yhF1QXnfjUjr1++8B/Z+t41X+gI7u71199Xnz3s09/QPIA++cQ6NO75poL/rS6+LhC2ONr94f/j60YYH9+q3pYTavBrspbqg//eZV/dMt+03Sy9e++uy8Z+AHAD54Afi8FcC/+rh9ovrbp2m/X/MBy/Gr1pPrL0UFgQynBp/fLffu/zOcesCy/Wj0u5Q8OQwE8tWv6xl+o/i4lEFi8Oe/LAvuhAJ7cn/Udv1hdf+5uKoGweDvzvS4AtoUCeGN/3bf+z+raO1bec9jbv1bnp/w+3n5+33Xz+6uy799zM/yefZXX39Ofl/kLm0EBvMFO3/JbdU111s7HRmeBrfXRW8e/vd9fdNt5/bl1+Zjb3/H9Yw7+x7F8txgdgK3xW6cqf7W7u1tP+Ku/aU+7hSfLMO9tsXMu+pP2xMnN2wl/zP/+BJ90Y/6F/V2v36f+P7Mam/HFYI0+h/f38czhU31+fT8F8OT6mt+59g/nHP+swe+4uQ2/n+j+1T92Zh/6yT9c///xOPQ1gGf4d9nt/BLst1T/cfvh1P/Tf+L5y/+J/99Q1/b1v1o9+ER/zraA93Gd/e99xV+dbS/eMNfn+RbgzGwHs3e23+G06hbV8zlFCayuOy5g3ew/3PGFQwBgT+6S8sde/VH/9qQF8PTnmwLAyX1Gyh979fxTlb9SAJfhr/rWXx8dAuC0bvDv7vsj/d/vP/4nFMDl+M3RAQBO62/6jp+rflr5g1P52ZP9pAK4HM/tW36r+tXRQQBOqh+pvr6vf8joHLDuTrICePZqg2yta69/wPO7/i/7l9WHRkcBOMHf9K3P7v+8dHQO2BSn/Ob4Pv9r6c43Pyj6P0/+l2ff/3pfe3l7+wg4w5/TPPZ+z/wx1vLjbMO/wdo4ssz//C4v33sczT//d6MBXPfh/Mj+g13fd/+78sf+3a36d7X11vu/s4x/bzunf/qHlX8A2I/HpPwdxmvbwvLXdFL/rl/oL/2iU29B3n5uPynO5HD/suwc/cCr/KNmqz/e9vN7rMMfzsE/xjr87uv/3+mP9lUJYNZ++PfqBTfzC3r4F/b+VwDXxaXnXdp//+0ffYL/1AD25NXf+atnVP5qd3c3f55bL8fX7vz8wKY4+vfq2j+qv+zzu8+xb+Mf/gX+jL/DGv7P8Frf8jc/de7fjA4CsEmObNmf/Tac/Wtb1R0fUF3vF1TzWgGsI/1E3/gT9Qujg8AI6/I5uC63J4xiDG++sz9xA/Bu/+53e8TxByP+7o/c5ZEd5luS3//Gr3ij1UAAbqC6X/XPqt36bx/3F3Yv/W4vPOPvuYeCfvh//+j/g0d+yP1+cqmdeLN8RxTo+7XYV+juvz76MdbPvFYAj6ydM//79PGf+8HfOJtNd+yPW//Fth3/39lfbvfIyb+Y/NTl/d05P/Vd5/zU9+zn912Xj7F2v3s98nuzUW/ren3XvO1c3eIp/VdnjQ4CAJt2E8gp/n0Y5qwz3P17w51/8Ef1C6uPAwDbxR2sALB+FEAA2O/x3+vtsT//W/9z4X/mjvV2PuubX3V29fS/MzAAe7Gqq36Pnf/42Ic/s6OT3Cj/Cf9u/7+/3/sTHv1o4xweZ9kfvwNmXaWzqz+snrWq8reXAngf/+MC9mZ/g5oF28//tz1/jLN/8uc/8vC7V1eeyX7t5fP+YP/OcZ8D27DaZt4CwHpRAAFg/d13Lx+jrui/f8G+7g/Y/n9ntfm2pxXAT/t/R38E2LfzVv3P79y0zytn/u2mf3k3n59L9aR+8kf+eLqcYAPz3Gjl36xVr/yr/ZyG5x/f0zXV91X/d9PT8g9nP6mPdb0fO+fnbp3ff3l2dp5bXV79ZHX2Md+w3//hB/sCo6dfdcD/WW/KffHp/9W2//9utz/Lf3d//1Pby3/z/f2+x67923P5q8P/f93vx+jEfDd+fcr4OEd//9W+vu9+HPqgagUQttG/qr60uqr6d9XX/+SPfeWDfvxHH/zv+7X/9Xf/26N+/LlP+g//6XN//Psf8FO/+Lgf/eVHV88//QehbvTvL+XfP+7z/sS/Y8d+3MdY7d/fw3ycv/x//uZl/dqhP+Y/OPr6LfXP+eWdI93v8tfV/c74b8D2+UTnPe/DH/3FZ1Z/VD3l++/+mZdWH1jw3wn9gpZpJ4PgE9XRJ/p9S/9cf1R1x3q6PefldV/XJe1HP1ZPq6ff8Fd/1/n5ofMumNLN6Oxt+OO25j+vuf/fH/0YP/G5f/WL9XXV71af1fv3+/+S0/6O7X9bvtr9//+43/xb7e+u61P7wOLT/P7rYy//X3v/+MP8+6f/O3Xy1KP/oZP99Nef9mOcZN/w3ycHGf77//+wz/973et/d/JtYP2vBth29fr6Y+/f5/+FO0B+mVufc+Ttt6r+d+f/3rl/88S/fuID/+qpf/PU//nC+rzqmv3+Ofv/H4Cl/y3Y1L/Vf/P2//wL9/0XR//M7/zF33nVY//z9+W/XQZ9S7b1f9/O+PfnVk7mV37l+iN/+bU333nXz/3Zy+pWz+4V/25f/2fP+L/I+vyecj8f45S/dqr3r2v7kp/4kvqF+o2u+7TqW/rBPj3//5dj/bJuwZ/lbfPVv/q3f/nFT1rA73f+e/7u0v/Xz67qj/7vr/3cqV4P/08M2/sntP+Pe+KX+8/9yZ/8ykse+5r/1rX/Z9UvtOD/9vv+X1nu/+zM5X/dq/+rX7v/z3zBN+Q/M8zmE+TN/d4v3PGH//kP3/R1T6ov2+f/a/38H4a+zL+T6/f75d5b+f9+vz/1aVcAmZ9rqm/+H3/9/z6r29aXPvdffu8X/dyT/8Vv/Pj/fvQomt2u/Y8/+tl/fH71r6v/6+Tf4WzHn/31/z239ey/+4nf/51/1eX98X/5N+/0J0d/+F/7+v/3W/93/2Zqf7s/+YPP+IuLz/rV3/+lf9Ut6k7f+Z1/+L1/desfqZ7Q0dcrq4P7/7P9K0f/++/bnfqN/9Ln/Pm/PvrOVx49afOSem7TP3/9sY/BDrPn7bx+v1/6nD/9L93s/zz68T9efbJ6RP1lF/36v3vGb37tk/9lv3/uA/69v+XRf/WKn/qMX7rw3zSN//f/+d/82H/rN//u3lv+eQT7YwXw1I5+0f+dv/xnX3rxM17x/35h//CHfu4/Vr//sx/5g/d9bvU3HT02+Je7f197+VX3+ptb3Lre/yOf/v/9+j/+nd/62f+j+qP/1Nffc+fID33oO/9w9z/VXz/oWz/r5ef8/g/+/k981XP/3T/5m5/4W3/rnrfq/z76F1/ZuT/2wEf9zRec+3P3+u//55P/4wfv9/RHXXPls//dG/67L/gP//t/9w1P/aE//P3z/tknvuNJu3/1y//uz//+/+7P/1P9Rj/Y//wf67Lecc6f3vtv/3+HfJlWa+fMb/ue+Xuf/6f/z+qLq+v+Tf/9bvmPbvHe//uP//h5X+tFuO/3+Hv1qH/1wG++/+u//pnVL8zp/++89F+3+o/Lf+4v/vRbPt+/DfCJprF/n57cfzy76t/1E/3ev68f7tf7Z//i/6z+09//kd+6f7+/+zt3PuWvP/Vbl/RnlrX/TxzBfqkT7N+x1b+d4/4L/+j4k/nZ3a0jf/Gz/+/b7D79e3f+1c/9l+/ovv/++h+ux+3+xy/5w/+8+5z/unvo+G/+v1b//13/1M/jFsHZFx5/B+Puz/zQT/7m7jd8+0/f+PeyN/0S/Lz2+7v44PbHW/WvYLm/8I3yv/afv1nHvp79xj2tAP6bl/7v1z/nU/9lAKdz7ZF/8/aX/Pnpfn2/n/9b+y3WKv87L//1+L3P/L0z/z6u/29W28tK38H/fP/kZ7/6Bz5zzv/v/C/+hP/PsJ++sO4//Tl/+SP/7m/u8c+9v3tbvMX5Lffxf/hP/u7vrl/1/7Hx1v/3+kW3f8E5H/iZh5z/P7+8L3n6+S/80qdf+qOP+ZdPXOTvu9+v9Kf/H5V/2I/TbQGfVV3Z9A3QKWztH8k2+m8/ffW/+/i3fOw//Zv/45H/4uOfu/OAn/2Kv/zKv/zvv/Ivj44RYFMe/bfA8nBb68W/dt1//eSdX37qj//yq/7rl/R9P/cVt/uB73jb3Y6Ovbv+nys/8vPX/+6/+a+P+f/u/vvnfetD/uhef+Zv58f//f0P75+d/f9y6PJX9vu9dXdf85SX/tU/Oe//O/KVz/vKe/zg97zl3jWV2cNsAU/flv/v1bWd/7/e45P//Kc+8/X/x2//X6tfBZj1f/Djf71dv8df3un/+eOtF//23/2LP+/TfuWXb/Hf//W1P/lnd/rrB3zT6//Z9b/xge/v11bf/fN85o4VwHNrpfeAvPVpL//gb/7Sn3z/O/7kP13+8WeeezYAe3P87Y+//LxX/5OPfP1fPuPf//Tlv/xrX/rTX//1v/ivb//Pq++P/+zTPv6mX/mD/+93PvK3j/u77/vnr5j2/6c/95f1mF/7Qp8DA/zlP/3Nr/zg+b/1wv/j+j+67Pf/5v1//l/+3b/58Md+a8A//5l17C7gC5dduL/jnT/0x5/4k99+4qf9xPdV/5/Vrj6cXz3kx57xkBeu4J+F/fvRev37/+Yv3/bw3/vlt3zo579q+kFgkR76ojs//YrfWsU//1v1wz/2Vz9x8yM//v998y//t9W/XfjH+Ot+v9+oj/3mv//rr/rwy3777f/zfW//rS98zT/65f/6l9s+/r/v//B//3fX/I8/+P/f8zf+xz+/9J/93K/99q/+h69Zyhbw/9jLx+hxT/r6d/71T/yPd1z3hh/7jje98Wl/+vwf/u0bLT0f6Kb4x/3Pf7PqP/O/t+d/4OjH2K3+Q7P/7/0v9h34rV/YfflH/uNj/v9/vuj/f+A//X+m/cz/69M/+PP/df//nxjs0fXU733Sk3/3cY//5q/93X/5u7/6r/7q+x5b/8lhP8d67UPf8++//r++8K++9tE/c/3/8qIn/c7/ftOP/Od/e/RP+n/rf1Z/Vf3J//MvfuMfnfODL/3df/zK//YZ/9eTH/cvf+unH/XZvzyO//hl5y72f85nVt8wZOyszhk+3//bM//Lr33r+b/w17/45R/93v/jT+onh40/gPX43+uDv/Dhf/rhN+zj91xZ/fRP/a8P/+Af1x/+2V/9xZv++vv/2yf+ZvpXfu2P/vjnXvMPP/x1D/ji9v++HfrY79f94G/e6T/++g/+n7d9wzNe/7ovO3f3L37+l/7Xuz/9BX//t8753Y/98R+/7cP/+n9+wS0++g9v9td/et7fnvPfP/6x93zw1hf8wGNvttvRld0z/Zn/5Kff+Lu/+Bf/tl/4lj+of9Av7Pu/s7e/B6c++q93Hb3l4/ib//LwG10D+NT+y/964z3c/dvOAXx5r+pjf/sNPf0tFz6kul/1Rz/+3V/16S/5kuf+4xf+5Ge84P/3Bf/lKb/yLZ/7P9/v5f/6c+7ystdeds8/ffVnXP66P3n0NU+68LE/9Z7Pumz3z156+VV/d//PvNvvvv5ud/3j19/1rs/5vXf//lXv+L9e8fY/f/R77vC6//tPHvvU3/nyX/uzxz/g0b//f7z/E7e+8C/e1I+8Vz/yjn/5qic96Hf++MJ7v+21t7jN29779M946w8/51tfcb/XfvTfP+itL7r3La/45u9+9wt+7pHvfO5fV39Wd1/xtx3/u0/rP86TG/vY/+c9YV//Lb2xH+mLOtkxMJ9dv/hNb/q0Rx//03c8fs//jM/rPzvFx9rvx/vF073fF/X8e/7R37zg85/5olu+7Vu/8j0v+sYvPf4IisP8e3h69d/O8Hf+xE/2j/ed69/0aS85/h/88cfu1quf9KevOvn7nfz/4/Hv/dj+4qKfO8Xv/aRTvM+pfs+T/+9u7x/v+I9xv+MHwed95H/P+f//F3+D//Nn/qCG+pf16fXO//bNz3/9U77pi+78S4/9hvu95N8+9rc+76v/2Tf80ed81N/6M+rV9ZO98l/9wQue8PzffvKTXv/TT//sD1z2Na/8hkc85MmPefk/evC9Xvczt/2DF//ZZ770qtv9wi0e+VeffZs3PP5XXv4t9//qx/3sU3/xC175L77sFw75MVbhLF/oD+QT/dX//e+++WFf/8/vcOl3f/UX/dE/u/fH//3PXPWPn/M1v/XLF/3/PvWX/8X17/ySn3/Sz1z+3/+vl5/7z256/e/8zt/+28d84u/e69P+/KHPv8/rv/3r/tX//Mrbnfdf/viffsNvvvy9H/m6d/Q//tW5v3v+n/ypb/zzxx33Z3v/u6V/fnzhz/3i4354NX/3N99l/fwjr3nh3a965rve+67/8Jf/8aN/8Nf/7o0PecfHX/Sx3/vwhf/hbp/29I/+6v0u+YuH7f7N/+97V/BxVvtxVvr3B2BubtKTL3vz9f/yA3/26qfdPPtgH+j1T3nlq1/12l/763d/w+++4ntvtfrH/gHAIt2kvRbA//aJ+5//yOe/7NEv+7k/+PbXffvb73vJy9/wqPv+5lv+7dvu+nsfz+oUAPCmzv7S//rQJ/79f7vbCx92h1c89dNf9qDP+51/dMc33v4fb3r5AwDwm3XXTY/3AQD27c39//O/AQCHtlPde3QIAABWxwogsA6P+vJ5PAJrwb8DpzT3z8FlsAIIrCMLDSzSevz94YaLNF4vCiCwjiw0sEjr8feHT/48W+FbozPs1eOPu73/hu/yT+bwg8t+Ot7h//1TvK8fhEWxqwUc3/LUOgAAIABJREFUzNxWAE/F5w2r8DvTPy7O1n4Onp0fAABgW7kGEDjepq8A2/6HI7u7y7gR7tJ+99+tOArAsn2i7iD/qTaXbxZh+bb+m4nrf6LrP1H95ZF/2y32/q/cNI9Af7R6W/XGpoW82g/fRMJ6OPP/39V+Ti76c+vEf+/Ez8u5/b/l8M50w8N6/R3c73/z+v4/lv+P/H44k7d0/YvP+s+rLX//9bv/1+eODrJXx67bPHYY+Q/Vk0YGAoA5euY/q147OsRe7RypvqP68NEfAQC22rlH/8hAZ439yAAgAACr9v8HQqvDDDQevdIAAAAASUVORK5CYII=';

const LOGO_HTML = `
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 14px; border-radius: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">
       <img
          src="data:image/png;base64,${TRUCK_LOGO_BASE64}"
          alt="FleetMaster Hub"
          width="32"
          height="32"
          style="display:block"
       />
    </div>
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 900; color: #1e293b; font-size: 22px; margin-top: 12px; letter-spacing: -0.025em;">FleetMaster <span style="color: #4f46e5;">Hub</span></div>
  </div>
`;

export const templates = {
  welcome: (username: string, token: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155; text-align: center;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">¡Bienvenido a bordo, ${username}!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Gracias por confiar en <strong>FleetMaster Hub</strong> para la gestión de tu flota.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${ENV.FRONTEND_URL}/#/confirm/${token}" style="background-color: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Confirmar mi cuenta</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
  `,
  driverWelcome: (name: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">¡Bienvenido al Equipo, ${name}!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Has sido registrado exitosamente como conductor en FleetMaster Hub.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <h3 style="font-size: 14px; color: #4f46e5; margin-top: 0;">Términos y Condiciones Básicos:</h3>
        <ul style="font-size: 13px; color: #64748b; padding-left: 18px;">
          <li>El vehículo debe mantenerse en óptimas condiciones de limpieza.</li>
          <li>Los pagos de renta deben realizarse antes del vencimiento para evitar moras.</li>
          <li>Cualquier daño o siniestro debe reportarse inmediatamente al administrador.</li>
        </ul>
      </div>
    </div>
  `,
  vehicleAssignment: (name: string, vehicle: any) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">Nuevo Vehículo Asignado</h2>
      <p style="font-size: 16px; line-height: 1.6;">Hola ${name}, se te ha asignado un nuevo vehículo para tu operación.</p>
      <div style="background: #f1f5f9; padding: 32px; border-radius: 20px; text-align: center; margin: 32px 0;">
        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Placa del Vehículo</div>
        <div style="font-size: 32px; font-weight: 900; color: #4f46e5; font-family: monospace;">${vehicle.licensePlate}</div>
        <div style="font-size: 14px; font-weight: bold; color: #1e293b; margin-top: 8px;">${vehicle.model} (${vehicle.year})</div>
      </div>
      <p style="font-size: 13px; text-align: center; color: #64748b;">Recuerda realizar la inspección inicial y reportar cualquier novedad.</p>
    </div>
  `,
  adminNewUser: (data: { username: string; email: string; date: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 20px; margin-bottom: 24px;">Nuevo Usuario Registrado</h2>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <p><strong>Usuario:</strong> ${data.username}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Fecha:</strong> ${data.date}</p>
      </div>
    </div>
  `,
  passwordReset: (token: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">Recuperación de Acceso</h2>
      <div style="background: #f8fafc; padding: 32px; text-align: center; border-radius: 16px; margin: 32px 0; border: 1px dashed #cbd5e1;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">${token}</span>
      </div>
    </div>
  `,
  paymentConfirmation: (amount: number, date: string, type: string, createdArrear: number, totalDebt: number, pendingArrears: any[]) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <h2 style="color: #15803d; margin: 0; font-size: 20px;">Comprobante de Pago Exitoso</h2>
        <p style="color: #166534; font-size: 14px; margin: 8px 0 0 0;">Tu pago ha sido procesado y registrado correctamente.</p>
      </div>

      <h3 style="color: #1e293b; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">Detalle de la Transacción</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Monto Recibido:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: 800; font-size: 18px;">$${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Concepto:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: 600;">${type === 'renta' ? 'Renta' : 'Abono a Mora'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Fecha de Registro:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b;">${date}</td>
        </tr>
        ${createdArrear > 0 ? `
        <tr>
          <td style="padding: 12px 0; color: #e11d48; font-size: 14px; font-weight: bold;">Nueva Mora Generada:</td>
          <td style="padding: 12px 0; text-align: right; color: #e11d48; font-weight: 800;">$${createdArrear.toLocaleString()}</td>
        </tr>
        ` : ''}
      </table>

      ${totalDebt > 0 ? `
      <div style="margin-top: 40px; padding: 24px; background-color: #fff1f2; border-radius: 20px; border: 1px solid #fecdd3;">
        <h3 style="color: #be123c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0; display: flex; align-items: center;">
          Resumen de Deuda Pendiente
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${pendingArrears.map(a => `
            <tr>
              <td style="padding: 6px 0; color: #9f1239;">Mora del ${a.dueDate}</td>
              <td style="padding: 6px 0; text-align: right; color: #be123c; font-weight: bold;">$${a.amountOwed.toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr style="border-top: 1px solid #fda4af;">
            <td style="padding: 12px 0 0 0; font-weight: 800; color: #9f1239; font-size: 15px;">TOTAL ACUMULADO:</td>
            <td style="padding: 12px 0 0 0; text-align: right; font-weight: 900; color: #e11d48; font-size: 18px;">$${totalDebt.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      ` : `
      <div style="margin-top: 40px; padding: 16px; background-color: #f0fdf4; border-radius: 12px; text-align: center; border: 1px solid #dcfce7;">
        <p style="color: #15803d; font-size: 13px; font-weight: bold; margin: 0;">¡Tu cuenta está al día! No tienes moras pendientes.</p>
      </div>
      `}

      <div style="margin-top: 48px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Este es un comprobante automático generado por FleetMaster Hub.</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">© 2025 FleetMaster Hub System.</p>
      </div>
    </div>
  `,
  paymentFailed: (data: { plan: string; reference: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <h2 style="color: #b91c1c; margin: 0; font-size: 20px;">Pago no procesado</h2>
        <p style="color: #991b1b; font-size: 14px; margin: 8px 0 0 0;">Lamentablemente tu pago para el plan <strong>${data.plan.toUpperCase()}</strong> fue declinado.</p>
      </div>
      <p style="font-size: 14px; color: #64748b; text-align: center;">Referencia: ${data.reference}</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${ENV.APP_URL}/#/pricing-checkout" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Intentar de nuevo</a>
      </div>
    </div>
  `,
  adminPaymentNotification: (data: { user: string; email: string; plan: string; amount: number; reference: string; date: string }) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #4f46e5; border-radius: 16px; padding: 24px; text-align: center; color: white; margin-bottom: 32px;">
        <h2 style="margin: 0; font-size: 20px;">Nuevo Pago Recibido</h2>
        <p style="opacity: 0.8; font-size: 14px; margin-top: 8px;">Una nueva suscripción ha sido activada en la plataforma.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Usuario:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: bold;">${data.user}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Email:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b;">${data.email}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Plan:</td>
          <td style="padding: 12px 0; text-align: right; color: #4f46e5; font-weight: 800; text-transform: uppercase;">${data.plan}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Monto:</td>
          <td style="padding: 12px 0; text-align: right; color: #15803d; font-weight: 800;">$${data.amount.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #64748b;">Referencia:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-mono font-bold;">${data.reference}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b;">Fecha:</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b;">${data.date}</td>
        </tr>
      </table>
    </div>
  `,
  /* ================= ALERTAS ================= */

  documentExpirationAlert: (data: {
    vehiclePlate: string;
    type: string;
    daysRemaining: number;
    expirationDate: string;
  }) => `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;padding:48px;border:1px solid #e2e8f0;border-radius:24px;text-align:center;">
      ${LOGO_HTML}
      <h2 style="color:#b45309;">Alerta de Vencimiento</h2>
      <p>${data.type} del vehículo ${data.vehiclePlate}</p>
      <h1>${data.daysRemaining} días</h1>
      <p>Vence el ${data.expirationDate}</p>
    </div>
  `,
  subscriptionExpirationAlert: (data: {
    plan: string;
    daysRemaining: number;
    expirationDate: string;
  }) => `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;padding:48px;border:1px solid #e2e8f0;border-radius:24px;text-align:center;">
      ${LOGO_HTML}
      <h2>Tu plan está por expirar</h2>
      <p>Plan ${data.plan.toUpperCase()}</p>
      <h1>${data.daysRemaining} días</h1>
      <p>Expira el ${data.expirationDate}</p>
      <a href="${ENV.APP_URL}/#/pricing-checkout"
         style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
         Renovar ahora
      </a>
    </div>
  `,
  weeklyEnterpriseReport: (stats: any) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <div style="background-color: #4f46e5; border-radius: 20px; padding: 32px; text-align: center; color: white; margin-bottom: 32px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 900;">Reporte Semanal Enterprise</h2>
        <p style="opacity: 0.8; font-size: 14px; margin-top: 8px;">Consolidado de operación del ${stats.dateRange}</p>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em;">Resumen Financiero</h3>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Recaudado</div>
            <div style="font-size: 18px; font-weight: 900; color: #15803d;">$${stats.income.toLocaleString()}</div>
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase;">Gastado</div>
            <div style="font-size: 18px; font-weight: 900; color: #e11d48;">$${stats.expenses.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
         <div style="font-size: 12px; color: #475569; font-weight: 800;">UTILIDAD NETA DE LA SEMANA</div>
         <div style="font-size: 28px; font-weight: 900; color: #1e293b;">$${stats.net.toLocaleString()}</div>
      </div>

      <div>
        <h3 style="font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.1em;">Cartera Pendiente</h3>
        <table style="width: 100%; font-size: 14px;">
           <tr style="border-bottom: 1px solid #e2e8f0;">
             <td style="padding: 12px 0;">Total Moras Pendientes:</td>
             <td style="text-align: right; font-weight: 800; color: #be123c;">$${stats.totalDebt.toLocaleString()}</td>
           </tr>
           <tr>
             <td style="padding: 12px 0;">Vehículos Rentados:</td>
             <td style="text-align: right; font-weight: 800;">${stats.activeVehicles} de ${stats.totalVehicles}</td>
           </tr>
        </table>
      </div>

      <div style="margin-top: 40px; padding: 16px; background: #eff6ff; border-radius: 12px; text-align: center; border: 1px solid #dbeafe;">
        <p style="color: #1e40af; font-size: 12px; margin: 0; font-weight: bold;">Este reporte automático es parte de su plan Enterprise.</p>
      </div>
    </div>
  `,
  contactNotification: (name: string, email: string, message: string) => `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 48px; border-radius: 24px; color: #334155;">
      ${LOGO_HTML}
      <h2 style="color: #1e293b; text-align: center; font-size: 24px; margin-bottom: 24px;">Nuevo Mensaje de Contacto</h2>
      <p style="font-size: 16px; line-height: 1.6;">Has recibido un nuevo mensaje desde el landing page de <strong>FleetMaster Hub</strong>.</p>
      <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="font-style: italic; color: #475569;">"${message}"</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático generado por FleetMaster Hub.</p>
    </div>
  `
};