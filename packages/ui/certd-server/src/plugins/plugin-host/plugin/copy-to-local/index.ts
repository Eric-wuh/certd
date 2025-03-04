import { AbstractTaskPlugin, IsTaskPlugin, pluginGroups, RunStrategy, TaskInput, TaskOutput } from '@certd/pipeline';
import { CertInfo, CertReader } from '@certd/plugin-cert';
import * as fs from 'fs';
import { Constants } from '../../../../basic/constants.js';
import path from 'path';

@IsTaskPlugin({
  name: 'CopyToLocal',
  title: '复制到本机',
  group: pluginGroups.host.key,
  default: {
    strategy: {
      runStrategy: RunStrategy.SkipWhenSucceed,
    },
  },
})
export class CopyCertToLocalPlugin extends AbstractTaskPlugin {
  @TaskInput({
    title: '证书保存路径',
    helper: '需要有写入权限，路径要包含文件名，文件名不能用*?!等特殊符号\n推荐使用相对路径，将写入与数据库同级目录，无需映射，例如：./tmp/cert.pem',
    component: {
      placeholder: './tmp/cert.pem',
    },
  })
  crtPath!: string;
  @TaskInput({
    title: '私钥保存路径',
    helper: '需要有写入权限，路径要包含文件名，文件名不能用*?!等特殊符号\n推荐使用相对路径，将写入与数据库同级目录，无需映射，例如：./tmp/cert.key',
    component: {
      placeholder: './tmp/cert.key',
    },
  })
  keyPath!: string;

  @TaskInput({
    title: 'PFX证书保存路径',
    helper: '需要有写入权限，路径要包含文件名，文件名不能用*?!等特殊符号\n推荐使用相对路径，将写入与数据库同级目录，无需映射，例如：./tmp/cert.pfx',
    component: {
      placeholder: './tmp/cert.pfx',
    },
  })
  pfxPath!: string;

  @TaskInput({
    title: 'DER证书保存路径',
    helper:
      '需要有写入权限，路径要包含文件名，文件名不能用*?!等特殊符号\n推荐使用相对路径，将写入与数据库同级目录，无需映射，例如：./tmp/cert.der\n.der和.cer是相同的东西，改个后缀名即可',
    component: {
      placeholder: './tmp/cert.der 或 ./tmp/cert.cer',
    },
  })
  derPath!: string;

  @TaskInput({
    title: '域名证书',
    helper: '请选择前置任务输出的域名证书',
    component: {
      name: 'pi-output-selector',
      from: 'CertApply',
    },
    required: true,
  })
  cert!: CertInfo;

  @TaskOutput({
    title: '证书保存路径',
    type: 'HostCrtPath',
  })
  hostCrtPath!: string;

  @TaskOutput({
    title: '私钥保存路径',
    type: 'HostKeyPath',
  })
  hostKeyPath!: string;

  @TaskOutput({
    title: 'PFX保存路径',
    type: 'HostPfxPath',
  })
  hostPfxPath!: string;

  @TaskOutput({
    title: 'DER保存路径',
    type: 'HostDerPath',
  })
  hostDerPath!: string;

  async onInstance() {}

  copyFile(srcFile: string, destFile: string) {
    this.logger.info(`复制文件：${srcFile} => ${destFile}`);
    const dir = path.dirname(destFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(srcFile, destFile);
  }
  async execute(): Promise<void> {
    let { crtPath, keyPath, pfxPath, derPath } = this;
    const certReader = new CertReader(this.cert);

    const handle = async ({ reader, tmpCrtPath, tmpKeyPath, tmpDerPath, tmpPfxPath }) => {
      this.logger.info('复制到目标路径');
      if (crtPath) {
        crtPath = crtPath.startsWith('/') ? crtPath : path.join(Constants.dataDir, crtPath);
        this.copyFile(tmpCrtPath, crtPath);
        this.hostCrtPath = crtPath;
      }
      if (keyPath) {
        keyPath = keyPath.startsWith('/') ? keyPath : path.join(Constants.dataDir, keyPath);
        this.copyFile(tmpKeyPath, keyPath);
        this.hostKeyPath = keyPath;
      }
      if (pfxPath) {
        pfxPath = pfxPath.startsWith('/') ? pfxPath : path.join(Constants.dataDir, pfxPath);
        this.copyFile(tmpPfxPath, pfxPath);
        this.hostPfxPath = pfxPath;
      }
      if (derPath) {
        derPath = derPath.startsWith('/') ? derPath : path.join(Constants.dataDir, derPath);
        this.copyFile(tmpDerPath, derPath);
        this.hostDerPath = derPath;
      }
      this.logger.info('请注意，如果使用的是相对路径，那么文件就在你的数据库同级目录下，默认是/data/certd/下面');
      this.logger.info('请注意，如果使用的是绝对路径，文件在容器内的目录下，你需要给容器做目录映射才能复制到宿主机');
    };

    await certReader.readCertFile({ logger: this.logger, handle });

    this.logger.info('执行完成');
  }
}

new CopyCertToLocalPlugin();
