const config = window.CONFIG;

for (let key in config.entities) {
  let entity = config.entities[key];
  entity.path = key;
  entity.endpoint = entity.endpoint || key;
  let listFields = (entity.list && entity.list.fields) || entity.fields;
  entity.listFields = [];
  for (let name in listFields) {
    entity.listFields.push(listFields[name]);
  }
}

export const getEntity = name => {
  return config.entities[name];
};

config.getEntity = getEntity;

export default config;
