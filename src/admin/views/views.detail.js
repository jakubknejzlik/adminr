import { getEntity } from "../config";
import { renderTemplate } from "../utils";
import { getField } from "./fields";

export const createAddView = entity => {
  let connector = entity.connector.list();
  let title = entity.create && entity.create.title;
  if (!title) {
    let name = entity.name || entity.path;
    title = `${name} Create`;
  }

  let createView = {
    path: `${entity.path}/new`,
    title: title,
    actions: {
      add: function(req) {
        return connector.create(req);
      }
    }
  };

  createView.fieldsets = getFieldsets(entity, ["create", "edit"]);

  return createView;
};

export const createChangeView = entity => {
  let fieldsets = (entity.edit && entity.edit.fieldsets) || entity.fieldsets;
  if (!fieldsets) {
    let fields = (entity.edit && entity.edit.fields) || entity.fields;
    fieldsets = [{ fields }];
  }
  let fields = fieldsets.reduce(
    (accumulator, currentValue) => accumulator.concat(currentValue.fields),
    []
  );

  let connector = entity.connector;
  let title = entity.edit && entity.edit.title;
  if (!title) {
    let name = entity.name || entity.path;
    title = `${name} Detail`;
  }

  let changeView = {
    path: `${entity.path}/:id`,
    title: title,
    actions: {
      get: function(req) {
        return connector.detail(crudl.path.id, fields).read(req);
      },
      save: function(req) {
        return connector.detail(crudl.path.id, fields).update(req);
      },
      delete: function(req) {
        return connector.detail(crudl.path.id, fields).delete(req);
      }
    },
    validate(data) {
      // Check the data
      // console.log("??", data);
      return {};
      // return { email: "invalid email" };
      // return data;
    }
  };

  changeView.fieldsets = getFieldsets(entity, ["edit"]);

  changeView.tabs = getTabs(entity);

  return changeView;
};

const getFieldsets = (entity, types) => {
  let fieldsets = null;
  for (let type of types) {
    fieldsets = entity[type] && entity[type].fieldsets;
    if (fieldsets) break;
  }
  fieldsets = fieldsets || entity.fieldsets;
  if (!fieldsets) {
    let fields = null;
    for (let type of types) {
      let fields = entity[type] && entity[type].fields;
      if (fields) break;
    }
    fields = fields || entity.fields || [];
    fieldsets = [{ fields }];
  }
  return fieldsets.map(fieldset =>
    Object.assign({}, fieldset, {
      fields: fieldset.fields.map(field => getField(field))
    })
  );
};

const getTabs = entity => {
  let tabs = (entity.edit && entity.edit.tabs) || [];
  return tabs.map(getTab);
};

const getTab = tab => {
  let entity = getEntity(tab.reference.entity);
  let listConnector = entity.connector.list(tab.fields, 99999);

  let fields = tab.fields.map(field => getField(field));
  fields.push({ name: "id", hidden: true });
  fields.push({
    name: tab.reference.attribute,
    hidden: true,
    getValue: () => crudl.path.id
  });

  return {
    title: tab.title,
    actions: {
      list: req =>
        listConnector.read(
          req
            .filter(tab.reference.attribute, crudl.path.id)
            .sort(getSortingForOrder(tab.order))
        ),
      add: req => listConnector.create(req),
      save: req => entity.connector.detail(req.data.id, tab.fields).update(req),
      delete: req =>
        entity.connector.detail(req.data.id, tab.fields).delete(req)
    },
    getItemTitle: data => renderTemplate(tab.itemTitle, data), // Define the item title (Optional)
    fields: fields
  };
};

// convert -field => {sorder:'descending',sortKey:'field'}
const getSortingForOrder = order => {
  if (!order) return [];
  if (typeof order === "string") order = order.split(",");
  return order.map(item => {
    let dir = "ascending";
    if (item[0] === "-") {
      item = item.replace("-", "");
      dir = "descending";
    }
    return { sorted: dir, sortKey: item };
  });
};
