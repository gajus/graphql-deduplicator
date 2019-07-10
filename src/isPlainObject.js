// @flow

const isPlainObject = (object: Object) => {
  if (typeof object === 'object' && object !== null) {
    return Object.prototype.toString.call(object) === '[object Object]';
  }

  return false;
};

export default isPlainObject;
