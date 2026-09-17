const axios = require("axios");

const getAdzunaJobs = async ({
  page = 1,
  what = "",
  where = "",
}) => {
  const params = {
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: 20,
    what: what || "IT software technology",
  };

  if (where) {
    params.where = where;
  }

  const response = await axios.get(
    `https://api.adzuna.com/v1/api/jobs/in/search/${page}`,
    {
      params,
    }
  );

  return response.data;
};

module.exports = {
  getAdzunaJobs,
};