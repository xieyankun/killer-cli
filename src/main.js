
// 找到要执行的核心文件
// 1. 要解析用户的参数
const program = require('commander');
const path = require('path');
const { version } = require('./constants.js');


// console.log(version, process.argv)

const mapActions = {
  create: {
    alias: 'c',
    description: 'creat a project',
    examples: [
      'killer-cli create <project-name>'
    ]
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'killer-cli config set <k> <v>',
      'killer-cli config get <k>'
    ]
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: []
  }
}

// Object,keys()
Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action)  // 配置命令的名字
    .alias(mapActions[action].alias)   // 命令的别名
    .description(mapActions[action].description) // 命令的描述
    .action(() => {
      if(action === '*') {  // 访问不到对应的命令时，就打印找不到命令
        console.log(mapActions[action].description);
      } else {
        // console.log(action);
        // killer-cli create xxx // [node, killer-cli, create, xxx]
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    })
})

// 监听用户的help事件
program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach(action => {
    mapActions[action].examples.forEach(example => {
      console.log(`  ${example}`);
    })
  })
})


// 解析用户传递过来的参数
program.version(version).parse(process.argv)
