var axios = require('axios')

// axios.get('http://127.0.0.1:7001/api/v1/alarm')

const fetchRepoList = async () => {
  // const { data } = await axios.get('https://api.github.com/orgs/killer-templates/repos')
  const { data } = await axios.get('https://api.github.com/repos/killer-templates/vue-h5/tags')
  console.log(data)
  return data;
}


fetchRepoList()



    // .then(function (response) {
    //     console.log(response.data)
    // })
    // .catch(function (error) {
    //     console.log(error)
    // })