const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');

const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');
// 把异步的api转化成promise
downloadGitRepo = promisify(downloadGitRepo);

const { downloadDirectory } = require('./constants');

const path = require('path');
const fs = require('fs');

let { ncp } = require('ncp');
ncp = promisify(ncp);

// 遍历文件夹 找需不需要渲染
const Metalsimth = require('metalsmith');

// consolidate 统一了所以的模版引擎
let { render } = require('consolidate').ejs;
render = promisify(render)

// create 的所有逻辑

// create 功能是创建项目
// 拉取所以的git项目出来，让用户选择安装那个项目 projectName
// 选完后显示所有的版本好 1.0

// https:api.github.com/orgs/killer-cli/repos  获取组织下的仓库
// 可能还需要用户配置一些数据 来结合渲染自己的项目
const fetchRepoList = async () => {
  try {
    const { data } = await axios.get('https://api.github.com/orgs/killer-templates/repos')
    return data;
  } catch (error) {
    throw error;
  }
}

// 获取tag版本号
const fetchTagList = async (repo) => {
  try {
    const { data } = await axios.get(`https://api.github.com/repos/killer-templates/${repo}/tags`);
    return data;
  } catch (error) {
    throw error;
  }
}

// 封装loading效果
const waitFnloading = (fn, message) => async(...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn();
  // setTimeout(() => {
  //   spinner.succeed();
  // }, 2000)
  spinner.succeed();
  return result;
}

const download = async (repo, tag) => {
  let api = `killer-templates/${repo}`;
  if(tag) {
    api += `#${tag}`;
  }
  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dest);
  return dest;
}


module.exports = async (projectName) => {
  // let repos = await fetchRepoList();
  let repos = await waitFnloading(fetchRepoList, 'fetching template ....')();
  repos = repos.map(item => item.name);

  // 获取之前 显示loading，
  console.log(repos)
  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choise a template to create peoject',
    choices: repos,
  })

  // 通过当前的选择的项目，拉取对应的版本
  // 获取对应的版本号
  let tags = await waitFnloading(fetchTagList, 'fetching tags ....')(repo); 
  tags = tags.map(item => item.name);

  const { tag } = await Inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choise a tags to create peoject',
    choices: tags,
  })
  console.log(repo, tag); // 下载的模版

  // 把模版放到一个临时目录里 存好，以备后期的使用
  // download-git-repo
  const result = await download(repo, tag);
  console.log(result);  // 下载的目录
  
  // 拿到了下载的目录 直接拷贝到当前执行的目录下即可 ncp
  // 复杂的情况需要模版渲染 渲染后再拷贝
  // 把template下的文件 拷贝到执行的目录下
  // 4）拷贝操作
  // 这个目录 项目名字是否存在，如果存在提示当前已经存在

  // 如果有ask.js文件   // .template/xxx
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(projectName));
  } else {
    // 复杂模版
    console.log('复杂模版');
    // 把git上的项目下载下来如果有ask文件就是一个复杂的模版，我们需要用户去选择，选择后编译模版
    // 1) 让用户填写信息
    await new Promise((resolve, reject) => {
      Metalsimth(__dirname)
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          // console.log(files);
          const args = require(path.join(result, 'ask.js'));
          const obj = await Inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          // 根据用户的输入 下载模版
          console.log(metal.metadata());
          const obj = meta.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            if(file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();  // 文件内容
              if (content.includes('<%')) {
                content = await render(content, obj);
                files[file].content = Buffer.from(content);
              }
            }
          })
          done();
        })
        .build(err => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        })
    })
    
    // 2） 用用户填写的信息去渲染模版

    // metalsmith 只要是模版编译 都需要用这个模块
  }




}