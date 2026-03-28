import _ from 'lodash';

export const safeJson = (json: any) => {
  if (_.isString(json)) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return json;
    }
  }
  return json;
};
