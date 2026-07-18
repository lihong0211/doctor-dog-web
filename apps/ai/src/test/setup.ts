import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver
afterEach(cleanup)

vi.mock('@ant-design/icons', () => {
  const TestIcon = (props: React.HTMLAttributes<HTMLSpanElement>) =>
    React.createElement('span', { ...props, 'aria-hidden': true })

  return {
    ApiOutlined: TestIcon,
    AppstoreOutlined: TestIcon,
    AudioOutlined: TestIcon,
    BarChartOutlined: TestIcon,
    BookOutlined: TestIcon,
    BulbOutlined: TestIcon,
    CloudOutlined: TestIcon,
    CodeOutlined: TestIcon,
    CompassOutlined: TestIcon,
    CustomerServiceOutlined: TestIcon,
    DatabaseOutlined: TestIcon,
    DollarOutlined: TestIcon,
    ExperimentOutlined: TestIcon,
    FilePdfOutlined: TestIcon,
    FileTextOutlined: TestIcon,
    ForkOutlined: TestIcon,
    GithubOutlined: TestIcon,
    GlobalOutlined: TestIcon,
    HeartOutlined: TestIcon,
    HomeOutlined: TestIcon,
    LineChartOutlined: TestIcon,
    LinkOutlined: TestIcon,
    MailOutlined: TestIcon,
    MenuOutlined: TestIcon,
    PlaySquareOutlined: TestIcon,
    ReadOutlined: TestIcon,
    RightOutlined: TestIcon,
    RobotOutlined: TestIcon,
    RocketOutlined: TestIcon,
    SearchOutlined: TestIcon,
    SmileOutlined: TestIcon,
    StarOutlined: TestIcon,
    SwapOutlined: TestIcon,
    TeamOutlined: TestIcon,
    ThunderboltOutlined: TestIcon,
    ToolOutlined: TestIcon,
    VideoCameraOutlined: TestIcon,
  }
})
