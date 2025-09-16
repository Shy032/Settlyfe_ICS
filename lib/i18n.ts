import { create } from "domain"

export const translations = {
  en: {
    // Navigation & Common
    dashboard: "Dashboard",
    calendar: "Calendar",
    taskBoard: "Task Board",
    tasks: "Tasks",
    dailyUpdates: "Daily Updates",
    ptoRequests: "PTO Requests",
    team: "Team",
    admin: "Admin Panel",
    signOut: "Sign Out",
    settings: "Settings",

    // Dashboard
    welcomeBack: "Welcome back",
    currentWCS: "Current WCS",
    quarterScore: "Quarter Score",
    effortCredit: "Effort Credit",
    outcomeCredit: "Outcome Credit",
    collabCredit: "Collab Credit",
    thisWeekScore: "This week's score",
    averageRecent: "Average of recent weeks",
    currentWeekEC: "Current week EC",
    currentWeekOC: "Current week OC",
    currentWeekCC: "Current week CC",
    checkMarkCount: "Check Mark Count",
    universalTasks: "Universal Tasks",
    groupOnlyTasks: "Group-Only Tasks",

    // Chat
    teamChat: "Team Chat",
    teamMembers: "Team Members",
    typeMessage: "Type a message...",
    selectMember: "Select a team member to start chatting",

    // Calendar
    logHours: "Log Hours",
    hoursWorked: "Hours Worked",
    description: "Description",
    whatWorkedOn: "What did you work on?",
    myHours: "My Hours",
    teamActivity: "Team Activity",
    totalHours: "Total Hours",
    activeMembers: "Active Members",
    avgDailyHours: "Avg Daily Hours",
    peakDay: "Peak Day",

    // Task Board
    notStarted: "Not Started",
    inProgress: "In Progress",
    done: "Done",
    createTask: "Create Task",
    taskTitle: "Task Title",
    dueDate: "Due Date",
    priority: "Priority",
    assignTo: "Assign To",
    everyone: "Everyone",
    teamOnly: "Team-Only",

    // Daily Updates
    todaysUpdate: "Today's Update",
    shareProgress: "Share your daily progress and achievements",
    whatWorkedToday: "What did you work on today?",
    relatedTask: "Related Task (Optional)",
    uploadScreenshot: "Upload Screenshot",
    postUpdate: "Post Daily Update",
    recentUpdates: "Recent Updates",

    // Settings
    userSettings: "User Settings",
    profileManagement: "Manage your profile and preferences",
    fullName: "Full Name",
    email: "Email",
    displayTitle: "Display Title",
    phoneNumber: "Phone Number",
    preferredLanguage: "Preferred Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    neon: "Neon",
    uploadPhoto: "Upload Photo",
    saveChanges: "Save Changes",
    cancel: "Cancel",

    // Team Management
    teamManagement: "Team Management",
    createTeam: "Create Team",
    deleteTeam: "Delete Team",
    assignLeader: "Assign Leader",
    teamName: "Team Name",
    allMembers: "All Members",

    // Timer
    timer: "Timer",
    start: "Start",
    stop: "Stop",
    timeRecorded: "Time Recorded",
    writeUpdate: "Write Daily Update",
    focusReminder: "Great focus! Stand up, walk around, and grab a coffee.",

    // PTO
    review: "Review",
    deletePermanently: "Delete Permanently",
    recentReviews: "Recent Reviews",

    // Confirmations
    confirmed: "Confirmed",
    revokeConfirmation: "Are you sure you want to revoke confirmation? This will notify upper management.",

    // Common Actions
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    loading: "Loading",
    error: "Error",
    success: "Success",
    yes: "Yes",
    no: "No",

    // Time
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    lastWeek: "Last Week",

    // Status
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    active: "Active",
    inactive: "Inactive",

    // Roles
    owner: "Owner",
    admin: "Admin",
    member: "Member",

    //decision
    decisions: "Decisions",
    createDecision: "Create",
    createdDate: "Created Date",
  },
  zh: {
    // Navigation & Common
    dashboard: "仪表板",
    calendar: "日历",
    taskBoard: "任务板",
    tasks: "任务",
    dailyUpdates: "每日更新",
    ptoRequests: "休假申请",
    team: "团队",
    admin: "管理面板",
    signOut: "退出登录",
    settings: "设置",

    // Dashboard
    welcomeBack: "欢迎回来",
    currentWCS: "当前WCS",
    quarterScore: "季度得分",
    effortCredit: "努力积分",
    outcomeCredit: "成果积分",
    collabCredit: "协作积分",
    thisWeekScore: "本周得分",
    averageRecent: "最近几周平均",
    currentWeekEC: "本周EC",
    currentWeekOC: "本周OC",
    currentWeekCC: "本周CC",
    checkMarkCount: "检查标记计数",
    universalTasks: "通用任务",
    groupOnlyTasks: "仅限团队任务",

    // Chat
    teamChat: "团队聊天",
    teamMembers: "团队成员",
    typeMessage: "输入消息...",
    selectMember: "选择团队成员开始聊天",

    // Calendar
    logHours: "记录工时",
    hoursWorked: "工作时长",
    description: "描述",
    whatWorkedOn: "你在做什么工作？",
    myHours: "我的工时",
    teamActivity: "团队活动",
    totalHours: "总工时",
    activeMembers: "活跃成员",
    avgDailyHours: "平均每日工时",
    peakDay: "高峰日",

    // Task Board
    notStarted: "未开始",
    inProgress: "进行中",
    done: "已完成",
    createTask: "创建任务",
    taskTitle: "任务标题",
    dueDate: "截止日期",
    priority: "优先级",
    assignTo: "分配给",
    everyone: "所有人",
    teamOnly: "仅限团队",

    // Daily Updates
    todaysUpdate: "今日更新",
    shareProgress: "分享您的每日进展和成就",
    whatWorkedToday: "您今天做了什么工作？",
    relatedTask: "相关任务（可选）",
    uploadScreenshot: "上传截图",
    postUpdate: "发布每日更新",
    recentUpdates: "最近更新",

    // Settings
    userSettings: "用户设置",
    profileManagement: "管理您的个人资料和偏好",
    fullName: "全名",
    email: "邮箱",
    displayTitle: "显示标题",
    phoneNumber: "电话号码",
    preferredLanguage: "首选语言",
    theme: "主题",
    light: "浅色",
    dark: "深色",
    neon: "霓虹",
    uploadPhoto: "上传照片",
    saveChanges: "保存更改",
    cancel: "取消",

    // Team Management
    teamManagement: "团队管理",
    createTeam: "创建团队",
    deleteTeam: "删除团队",
    assignLeader: "指定负责人",
    teamName: "团队名称",
    allMembers: "所有成员",

    // Timer
    timer: "计时器",
    start: "开始",
    stop: "停止",
    timeRecorded: "记录时间",
    writeUpdate: "写每日更新",
    focusReminder: "专注力很棒！站起来，走走，喝杯咖啡。",

    // PTO
    review: "审查",
    deletePermanently: "永久删除",
    recentReviews: "最近审查",

    // Confirmations
    confirmed: "已确认",
    revokeConfirmation: "您确定要撤销确认吗？这将通知上级管理层。",

    // Common Actions
    save: "保存",
    delete: "删除",
    edit: "编辑",
    confirm: "确认",
    loading: "加载中",
    error: "错误",
    success: "成功",
    yes: "是",
    no: "否",

    // Time
    today: "今天",
    yesterday: "昨天",
    thisWeek: "本周",
    lastWeek: "上周",

    // Status
    pending: "待处理",
    approved: "已批准",
    rejected: "已拒绝",
    active: "活跃",
    inactive: "非活跃",

    // Roles
    owner: "所有者",
    admin: "管理员",
    member: "成员",
  },
  ko: {
    // Navigation & Common
    dashboard: "대시보드",
    calendar: "캘린더",
    taskBoard: "작업 보드",
    tasks: "작업",
    dailyUpdates: "일일 업데이트",
    ptoRequests: "휴가 신청",
    team: "팀",
    admin: "관리자 패널",
    signOut: "로그아웃",
    settings: "설정",

    // Dashboard
    welcomeBack: "돌아오신 것을 환영합니다",
    currentWCS: "현재 WCS",
    quarterScore: "분기 점수",
    effortCredit: "노력 크레딧",
    outcomeCredit: "결과 크레딧",
    collabCredit: "협업 크레딧",
    thisWeekScore: "이번 주 점수",
    averageRecent: "최근 주 평균",
    currentWeekEC: "현재 주 EC",
    currentWeekOC: "현재 주 OC",
    currentWeekCC: "현재 주 CC",
    checkMarkCount: "체크 마크 수",
    universalTasks: "전체 작업",
    groupOnlyTasks: "팀 전용 작업",

    // Chat
    teamChat: "팀 채팅",
    teamMembers: "팀 멤버",
    typeMessage: "메시지를 입력하세요...",
    selectMember: "채팅할 팀 멤버를 선택하세요",

    // Calendar
    logHours: "시간 기록",
    hoursWorked: "작업 시간",
    description: "설명",
    whatWorkedOn: "무엇을 작업했나요?",
    myHours: "내 시간",
    teamActivity: "팀 활동",
    totalHours: "총 시간",
    activeMembers: "활성 멤버",
    avgDailyHours: "일평균 시간",
    peakDay: "피크 날",

    // Task Board
    notStarted: "시작 안함",
    inProgress: "진행 중",
    done: "완료",
    createTask: "작업 생성",
    taskTitle: "작업 제목",
    dueDate: "마감일",
    priority: "우선순위",
    assignTo: "할당 대상",
    everyone: "모든 사람",
    teamOnly: "팀 전용",

    // Daily Updates
    todaysUpdate: "오늘의 업데이트",
    shareProgress: "일일 진행 상황과 성과를 공유하세요",
    whatWorkedToday: "오늘 무엇을 작업했나요?",
    relatedTask: "관련 작업 (선택사항)",
    uploadScreenshot: "스크린샷 업로드",
    postUpdate: "일일 업데이트 게시",
    recentUpdates: "최근 업데이트",

    // Settings
    userSettings: "사용자 설정",
    profileManagement: "프로필 및 환경설정 관리",
    fullName: "전체 이름",
    email: "이메일",
    displayTitle: "표시 제목",
    phoneNumber: "전화번호",
    preferredLanguage: "선호 언어",
    theme: "테마",
    light: "라이트",
    dark: "다크",
    neon: "네온",
    uploadPhoto: "사진 업로드",
    saveChanges: "변경사항 저장",
    cancel: "취소",

    // Team Management
    teamManagement: "팀 관리",
    createTeam: "팀 생성",
    deleteTeam: "팀 삭제",
    assignLeader: "리더 지정",
    teamName: "팀 이름",
    allMembers: "모든 멤버",

    // Timer
    timer: "타이머",
    start: "시작",
    stop: "정지",
    timeRecorded: "시간 기록됨",
    writeUpdate: "일일 업데이트 작성",
    focusReminder: "훌륭한 집중력! 일어나서 걸어다니고 커피를 마시세요.",

    // PTO
    review: "검토",
    deletePermanently: "영구 삭제",
    recentReviews: "최근 검토",

    // Confirmations
    confirmed: "확인됨",
    revokeConfirmation: "확인을 취소하시겠습니까? 상급 관리자에게 알림이 전송됩니다.",

    // Common Actions
    save: "저장",
    delete: "삭제",
    edit: "편집",
    confirm: "확인",
    loading: "로딩 중",
    error: "오류",
    success: "성공",
    yes: "예",
    no: "아니오",

    // Time
    today: "오늘",
    yesterday: "어제",
    thisWeek: "이번 주",
    lastWeek: "지난 주",

    // Status
    pending: "대기 중",
    approved: "승인됨",
    rejected: "거부됨",
    active: "활성",
    inactive: "비활성",

    // Roles
    owner: "소유자",
    admin: "관리자",
    member: "멤버",
  },
  ja: {
    // Navigation & Common
    dashboard: "ダッシュボード",
    calendar: "カレンダー",
    taskBoard: "タスクボード",
    tasks: "タスク",
    dailyUpdates: "日次更新",
    ptoRequests: "PTO申請",
    team: "チーム",
    admin: "管理パネル",
    signOut: "サインアウト",
    settings: "設定",

    // Dashboard
    welcomeBack: "お帰りなさい",
    currentWCS: "現在のWCS",
    quarterScore: "四半期スコア",
    effortCredit: "努力クレジット",
    outcomeCredit: "成果クレジット",
    collabCredit: "コラボクレジット",
    thisWeekScore: "今週のスコア",
    averageRecent: "最近の週の平均",
    currentWeekEC: "今週のEC",
    currentWeekOC: "今週のOC",
    currentWeekCC: "今週のCC",
    checkMarkCount: "チェックマーク数",
    universalTasks: "全体タスク",
    groupOnlyTasks: "チーム専用タスク",

    // Chat
    teamChat: "チームチャット",
    teamMembers: "チームメンバー",
    typeMessage: "メッセージを入力...",
    selectMember: "チャットするチームメンバーを選択",

    // Calendar
    logHours: "時間記録",
    hoursWorked: "作業時間",
    description: "説明",
    whatWorkedOn: "何に取り組みましたか？",
    myHours: "私の時間",
    teamActivity: "チーム活動",
    totalHours: "総時間",
    activeMembers: "アクティブメンバー",
    avgDailyHours: "平均日次時間",
    peakDay: "ピーク日",

    // Task Board
    notStarted: "未開始",
    inProgress: "進行中",
    done: "完了",
    createTask: "タスク作成",
    taskTitle: "タスクタイトル",
    dueDate: "期限",
    priority: "優先度",
    assignTo: "割り当て先",
    everyone: "全員",
    teamOnly: "チーム専用",

    // Daily Updates
    todaysUpdate: "今日の更新",
    shareProgress: "日次の進捗と成果を共有",
    whatWorkedToday: "今日は何に取り組みましたか？",
    relatedTask: "関連タスク（オプション）",
    uploadScreenshot: "スクリーンショットアップロード",
    postUpdate: "日次更新を投稿",
    recentUpdates: "最近の更新",

    // Settings
    userSettings: "ユーザー設定",
    profileManagement: "プロフィールと設定の管理",
    fullName: "フルネーム",
    email: "メール",
    displayTitle: "表示タイトル",
    phoneNumber: "電話番号",
    preferredLanguage: "優先言語",
    theme: "テーマ",
    light: "ライト",
    dark: "ダーク",
    neon: "ネオン",
    uploadPhoto: "写真アップロード",
    saveChanges: "変更を保存",
    cancel: "キャンセル",

    // Team Management
    teamManagement: "チーム管理",
    createTeam: "チーム作成",
    deleteTeam: "チーム削除",
    assignLeader: "リーダー指定",
    teamName: "チーム名",
    allMembers: "全メンバー",

    // Timer
    timer: "タイマー",
    start: "開始",
    stop: "停止",
    timeRecorded: "時間記録済み",
    writeUpdate: "日次更新を書く",
    focusReminder: "素晴らしい集中力！立ち上がって歩き回り、コーヒーを飲みましょう。",

    // PTO
    review: "レビュー",
    deletePermanently: "完全削除",
    recentReviews: "最近のレビュー",

    // Confirmations
    confirmed: "確認済み",
    revokeConfirmation: "確認を取り消しますか？上級管理者に通知されます。",

    // Common Actions
    save: "保存",
    delete: "削除",
    edit: "編集",
    confirm: "確認",
    loading: "読み込み中",
    error: "エラー",
    success: "成功",
    yes: "はい",
    no: "いいえ",

    // Time
    today: "今日",
    yesterday: "昨日",
    thisWeek: "今週",
    lastWeek: "先週",

    // Status
    pending: "保留中",
    approved: "承認済み",
    rejected: "拒否済み",
    active: "アクティブ",
    inactive: "非アクティブ",

    // Roles
    owner: "オーナー",
    admin: "管理者",
    member: "メンバー",
  },
  es: {
    // Navigation & Common
    dashboard: "Panel de Control",
    calendar: "Calendario",
    taskBoard: "Tablero de Tareas",
    tasks: "Tareas",
    dailyUpdates: "Actualizaciones Diarias",
    ptoRequests: "Solicitudes de PTO",
    team: "Equipo",
    admin: "Panel de Admin",
    signOut: "Cerrar Sesión",
    settings: "Configuración",

    // Dashboard
    welcomeBack: "Bienvenido de vuelta",
    currentWCS: "WCS Actual",
    quarterScore: "Puntuación Trimestral",
    effortCredit: "Crédito de Esfuerzo",
    outcomeCredit: "Crédito de Resultado",
    collabCredit: "Crédito de Colaboración",
    thisWeekScore: "Puntuación de esta semana",
    averageRecent: "Promedio de semanas recientes",
    currentWeekEC: "EC de la semana actual",
    currentWeekOC: "OC de la semana actual",
    currentWeekCC: "CC de la semana actual",
    checkMarkCount: "Recuento de Marcas de Verificación",
    universalTasks: "Tareas Universales",
    groupOnlyTasks: "Tareas Solo del Grupo",

    // Chat
    teamChat: "Chat del Equipo",
    teamMembers: "Miembros del Equipo",
    typeMessage: "Escribe un mensaje...",
    selectMember: "Selecciona un miembro del equipo para chatear",

    // Calendar
    logHours: "Registrar Horas",
    hoursWorked: "Horas Trabajadas",
    description: "Descripción",
    whatWorkedOn: "¿En qué trabajaste?",
    myHours: "Mis Horas",
    teamActivity: "Actividad del Equipo",
    totalHours: "Horas Totales",
    activeMembers: "Miembros Activos",
    avgDailyHours: "Promedio de Horas Diarias",
    peakDay: "Día Pico",

    // Task Board
    notStarted: "No Iniciado",
    inProgress: "En Progreso",
    done: "Completado",
    createTask: "Crear Tarea",
    taskTitle: "Título de la Tarea",
    dueDate: "Fecha de Vencimiento",
    priority: "Prioridad",
    assignTo: "Asignar a",
    everyone: "Todos",
    teamOnly: "Solo Equipo",

    // Daily Updates
    todaysUpdate: "Actualización de Hoy",
    shareProgress: "Comparte tu progreso y logros diarios",
    whatWorkedToday: "¿En qué trabajaste hoy?",
    relatedTask: "Tarea Relacionada (Opcional)",
    uploadScreenshot: "Subir Captura de Pantalla",
    postUpdate: "Publicar Actualización Diaria",
    recentUpdates: "Actualizaciones Recientes",

    // Settings
    userSettings: "Configuración de Usuario",
    profileManagement: "Gestiona tu perfil y preferencias",
    fullName: "Nombre Completo",
    email: "Correo Electrónico",
    displayTitle: "Título de Visualización",
    phoneNumber: "Número de Teléfono",
    preferredLanguage: "Idioma Preferido",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    neon: "Neón",
    uploadPhoto: "Subir Foto",
    saveChanges: "Guardar Cambios",
    cancel: "Cancelar",

    // Team Management
    teamManagement: "Gestión de Equipos",
    createTeam: "Crear Equipo",
    deleteTeam: "Eliminar Equipo",
    assignLeader: "Asignar Líder",
    teamName: "Nombre del Equipo",
    allMembers: "Todos los Miembros",

    // Timer
    timer: "Temporizador",
    start: "Iniciar",
    stop: "Detener",
    timeRecorded: "Tiempo Registrado",
    writeUpdate: "Escribir Actualización Diaria",
    focusReminder: "¡Excelente concentración! Levántate, camina y toma un café.",

    // PTO
    review: "Revisar",
    deletePermanently: "Eliminar Permanentemente",
    recentReviews: "Revisiones Recientes",

    // Confirmations
    confirmed: "Confirmado",
    revokeConfirmation: "¿Estás seguro de que quieres revocar la confirmación? Esto notificará a la alta dirección.",

    // Common Actions
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    confirm: "Confirmar",
    loading: "Cargando",
    error: "Error",
    success: "Éxito",
    yes: "Sí",
    no: "No",

    // Time
    today: "Hoy",
    yesterday: "Ayer",
    thisWeek: "Esta Semana",
    lastWeek: "Semana Pasada",

    // Status
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
    active: "Activo",
    inactive: "Inactivo",

    // Roles
    owner: "Propietario",
    admin: "Administrador",
    member: "Miembro",
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en

export function useTranslation(language: Language = "en") {
  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  return { t }
}
