# UI 改版备份备注

## 改版前基线
- **Git commit**: `chore: UI改版前完整备份 - 字体缩放系统改造前基线`
- **日期**: 2026-06-28
- **状态**: 改版前完整代码已提交

## 改版内容：全局字体缩放系统

### 新增功能
1. **字体大小调节**：在「更多」页面新增字体缩放设置卡片
   - 四档可选：紧凑(85%) / 标准(100%) / 放大(115%) / 超大(130%)
   - 实时预览效果
   - 按钮文字本身也按对应档位缩放，直观展示
   
2. **全局自适应缩放**：
   - Text 组件统一处理：variant 基础字号 + style 传入的 fontSize 都自动缩放
   - TextInput 组件：所有硬编码 fontSize 改为动态计算
   - lineHeight 同步缩放（像素值 > 2 时缩放，CSS 倍率不处理）

3. **日间/夜间模式**：已有功能确认与字体缩放兼容
   - ThemeProvider 同时监听 appearanceMode 和 fontScale
   - 两种模式切换不影响字体缩放设置

### 技术架构
- **Store**: `fontScale: FontScaleLevel` + `setFontScale` (Zustand + persist, version 6)
- **Context**: `BentoTheme` 新增 `fontScale: number` 和 `fontScaleLevel: FontScaleLevel`
- **Text.tsx**: `scaleStyle()` 函数处理传入 style 的 fontSize/lineHeight 缩放
- **Hook**: `useFontScale()` 从 bento 组件库导出

### 修改文件清单
1. `store/fitness-store.ts` - 新增 fontScale 状态、setter、持久化、迁移
2. `components/bento/ThemeProvider.tsx` - Context 注入 fontScale
3. `components/bento/Text.tsx` - 核心缩放逻辑
4. `components/bento/LabeledInput.tsx` - TextInput fontSize 缩放
5. `components/bento/index.ts` - 导出 useFontScale
6. `app/(tabs)/more.tsx` - FontScaleCard 组件
7. `app/(tabs)/index.tsx` - 5 处 TextInput fontSize 缩放
8. `app/(tabs)/train.tsx` - 2 处 TextInput fontSize 缩放
9. `components/CalendarHistoryPanel.tsx` - 2 处 TextInput fontSize 缩放

### 设计决策
- 选择四档而非连续滑块：操作简单直观，适合中老年用户
- 档位范围 0.85~1.3：兼顾信息密度和可读性
- 通过 Text.tsx 统一处理 style.fontSize：覆盖 90%+ 文本，无需逐个组件修改
- Store version 5→6：确保旧用户数据平滑迁移
