import type { CSSProperties, ReactNode } from 'react'
import { Input, Button } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import './index.css'

interface AskInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  buttonText?: string
  minRows?: number
  maxRows?: number
  /** 输入框上方额外内容区（选择器、示例标签等） */
  topSlot?: ReactNode
  /** 输入框 box 内部顶部区域（示例标签等） */
  innerTopSlot?: ReactNode
  /** 发送按钮左侧额外操作区（复选框等，占据左侧空间） */
  extraActions?: ReactNode
  /** 发送按钮紧左侧操作区（次要按钮，与发送按钮同排右对齐） */
  preActions?: ReactNode
  className?: string
  style?: CSSProperties
}

export default function AskInput({
  value,
  onChange,
  onSend,
  placeholder = '发送消息',
  loading = false,
  disabled = false,
  buttonText = '发送',
  minRows = 1,
  maxRows = 3,
  topSlot,
  innerTopSlot,
  extraActions,
  preActions,
  className,
  style,
}: AskInputProps) {
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.shiftKey) {
      e.preventDefault()
      if (!loading && !disabled) onSend()
    }
  }

  return (
    <div className={`ask-input-wrap${className ? ` ${className}` : ''}`} style={style}>
      {topSlot && <div className="ask-input-top-slot">{topSlot}</div>}
      <div className="ask-input-box">
        {innerTopSlot && <div className="ask-input-inner-top-slot">{innerTopSlot}</div>}
        <Input.TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPressEnter={handlePressEnter}
          placeholder={placeholder}
          autoSize={{ minRows, maxRows }}
          disabled={loading || disabled}
          className={`ask-input-textarea${extraActions ? ' ask-input-textarea--with-footer' : ''}`}
        />
        <div className="ask-input-footer">
          {extraActions && <div className="ask-input-extra-actions">{extraActions}</div>}
          {preActions}
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            disabled={disabled}
            onClick={onSend}
            className="ask-send-btn"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
