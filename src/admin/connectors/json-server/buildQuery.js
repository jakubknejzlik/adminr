import url from "url";

export default function createBuildQuery(fields) {
  // Builds a new url using the request's url, filters, pagination, and sorting
  function urlWithQuery(req) {
    if (typeof req.url !== "string") {
      throw new Error(`Request URL must be a string. Found ${req.url}`);
    }

    const query = Object.assign({}, req.page && { _page: req.page }, {
      _limit: 30
    });

    if (req.filters.q) {
      query.q = req.filters.q;
      query.fields = fields.join(",");
    }
    for (let key in req.filters) {
      if (key !== "q") {
        query[key] = req.filters[key];
      }
    }

    if (req.sorting && req.sorting.length > 0) {
      let sort = req.sorting[0];
      query._sort = req.sorting.map(s => s.sortKey).join(",");
      query._order = req.sorting
        .map(s => (sort.sorted === "ascending" ? "asc" : "desc"))
        .join(",");
    }

    const parsed = url.parse(req.url, true);
    parsed.search = undefined;
    parsed.query = Object.assign({}, parsed.query, query);

    return url.format(parsed);
  }

  return function buildQuery(next) {
    return {
      create: req => {
        req.url = urlWithQuery(req);
        return next.create(req);
      },
      read: req => {
        req.url = urlWithQuery(req);
        return next.read(req);
      },
      update: req => {
        req.url = urlWithQuery(req);
        return next.update(req);
      },
      delete: req => {
        req.url = urlWithQuery(req);
        return next.delete(req);
      }
    };
  };
}
