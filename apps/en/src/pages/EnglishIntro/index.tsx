import { useEffect } from 'react';
import { ConfigProvider, Button, Card } from 'antd';
import qrCodeImg from '../../assets/mini-program-qrcode.png';
import Footer from '../../components/Footer';
import { enTheme } from '../../theme/antdTheme';
import './EnglishIntro.css';

const DESKTOP_DOWNLOADS = [
  {
    label: 'Mac (Apple Silicon)',
    href: 'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-arm.dmg',
  },
  {
    label: 'Mac (Intel)',
    href: 'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-intel.dmg',
  },
  {
    label: 'Windows',
    href: 'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0.exe',
  },
] as const;

export default function EnglishIntro() {
  useEffect(() => {
    document.title = '二仙桥大爷 | 学英语';
  }, []);

  return (
    <ConfigProvider theme={enTheme}>
      <div className="en-intro-scroll">
        <div className="en-intro">
          <header className="en-intro-nav">
            <span className="en-intro-nav-title">学英语</span>
            <Button type="primary" href="/english/console">
              进入控制台
            </Button>
          </header>

          <section className="en-intro-hero">
            <h1>随时随地，把单词学进脑子里</h1>
            <p>
              桌面端沉浸式背单词，小程序随手学，例句朗读、发音跟读、生词本自动同步，一套系统，两种用法。
            </p>
          </section>

          <section className="en-intro-cards">
            <Card className="en-intro-card" title="桌面端">
              <p>沉浸式背单词播放器，例句朗读、悬浮词幕、日常用语轮播，适合长时间专注学习。</p>
              <div className="en-intro-downloads">
                {DESKTOP_DOWNLOADS.map((item) => (
                  <Button key={item.label} href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="en-intro-card" title="小程序">
              <p>微信扫码即用，碎片时间随手背单词，数据与桌面端账号同步。</p>
              <div className="en-intro-qrcode">
                <img src={qrCodeImg} alt="学英语小程序二维码" width={160} height={160} />
                <span>微信扫码体验</span>
              </div>
            </Card>
          </section>

          <Footer />
        </div>
      </div>
    </ConfigProvider>
  );
}
