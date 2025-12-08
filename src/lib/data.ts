import { type DocumentData, type Timestamp } from "firebase/firestore";

export type Software = "Revit" | "SketchUp" | "AutoCAD";

export const softwareOptions: Software[] = ["Revit", "SketchUp", "AutoCAD"];

export type Hotkey = {
  id: string;
  command: string;
  keys: string;
  description: string;
  software: Software;
  isCustom?: boolean;
  userId?: string;
};

export const hotkeys: Hotkey[] = [
  { id: "h1", command: "Conduit", keys: "CN", description: "Малює кабельний короб (короїд).", software: "Revit" },
  { id: "h2", command: "Cable Tray", keys: "CT", description: "Малює кабельний лоток.", software: "Revit" },
  { id: "h3", command: "Electrical Equipment", keys: "EE", description: "Розміщує електричне обладнання (щити, ДБЖ, ДГУ).", software: "Revit" },
  { id: "h4", command: "Lighting Fixture", keys: "LF", description: "Розміщує освітлювальний прилад.", software: "Revit" },
  { id: "h5", command: "Electrical Fixture", keys: "EF", description: "Розміщує розетки, вимикачі та іншу фурнітуру.", software: "Revit" },
  { id: "h6", command: "Wire", keys: "W", description: "Малює електричний дріт.", software: "Revit" },
  { id: "h7", command: "Switch System", keys: "SS", description: "Створює або редагує систему вимикачів.", software: "Revit" },
  { id: "h8", command: "Power Circuit", keys: "PC", description: "Створює силовий електричний ланцюг.", software: "Revit" },
  { id: "h9", command: "Duct", keys: "DT", description: "Малює повітропровід для систем кондиціонування.", software: "Revit" },
  { id: "h10", command: "Flex Duct", keys: "DF", description: "Малює гнучкий повітропровід.", software: "Revit" },
  { id: "h11", command: "Air Terminal", keys: "AT", description: "Розміщує дифузор або решітку системи вентиляції.", software: "Revit" },
  { id: "h12", command: "Mechanical Equipment", keys: "ME", description: "Розміщує механічне обладнання (кондиціонери, вентилятори).", software: "Revit" },
  { id: "h13", command: "Align", keys: "AL", description: "Вирівнює один або більше елементів.", software: "Revit" },
  { id: "h14", command: "Move", keys: "MV", description: "Переміщує вибраний елемент.", software: "Revit" },
  { id: "h15", command: "Copy", keys: "CO", description: "Копіює вибраний елемент.", software: "Revit" },
  { id: "h16", command: "Rotate", keys: "RO", description: "Обертає вибраний елемент.", software: "Revit" },
  { id: "h17", command: "Create Similar", keys: "CS", description: "Створює елемент, подібний до вибраного.", software: "Revit" },
  { id: "h18", command: "Visibility/Graphics", keys: "VG / VV", description: "Відкриває діалогове вікно видимості/графіки.", software: "Revit" },
  { id: "h19", command: "Thin Lines", keys: "TL", description: "Перемикає відображення товщини ліній.", software: "Revit" },
  { id: "h20", command: "Section", keys: "TX", description: "Створює розріз.", software: "Revit" },
  { id: "h21", command: "Line", keys: "L", description: "Створює лінію.", software: "SketchUp" },
  { id: "h22", command: "Rectangle", keys: "R", description: "Малює прямокутник.", software: "SketchUp" },
  { id: "h23", command: "Circle", keys: "C", description: "Малює коло.", software: "SketchUp" },
  { id: "h24", command: "Push/Pull", keys: "P", description: "Витягує або вдавлює поверхню.", software: "SketchUp" },
  { id: "h25", command: "Move", keys: "M", description: "Переміщує, розтягує або копіює об'єкти.", software: "SketchUp" },
  { id: "h26", command: "Rotate", keys: "Q", description: "Обертає, розтягує, спотворює або копіює об'єкти.", software: "SketchUp" },
  { id: "h27", command: "Scale", keys: "S", description: "Масштабує або розтягує вибрані об'єкти.", software: "SketchUp" },
  { id: "h28", command: "Offset", keys: "F", description: "Створює копії ліній на однаковій відстані.", software: "SketchUp" },
  { id: "h29", command: "Line", keys: "L", description: "Створює прямий лінійний сегмент.", software: "AutoCAD" },
  { id: "h30", command: "Circle", keys: "C", description: "Створює коло.", software: "AutoCAD" },
  { id: "h31", command: "Copy", keys: "CO / CP", description: "Копіює об'єкти.", software: "AutoCAD" },
  { id: "h32", command: "Move", keys: "M", description: "Переміщує об'єкти.", software: "AutoCAD" },
  { id: "h33", command: "Rotate", keys: "RO", description: "Обертає об'єкти навколо базової точки.", software: "AutoCAD" },
  { id: "h34", command: "Trim", keys: "TR", description: "Обрізає об'єкти до країв інших об'єктів.", software: "AutoCAD" },
  { id: "h35", command: "Extend", keys: "EX", description: "Продовжує об'єкти до країв інших об'єктів.", software: "AutoCAD" },
  { id: "h36", command: "Erase", keys: "E", description: "Видаляє об'єкти з креслення.", software: "AutoCAD" },
];

export type WorkflowStep = {
  description: string;
  timestamp?: string;
};

export type Workflow = {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  videoId?: string;
  software: Software;
  isCustom?: boolean;
  userId?: string;
};

export const workflows: Workflow[] = [
    {
        id: "w1",
        title: "Створення та налаштування електричних ланцюгів",
        description: "Цей робочий процес показує, як ефективно створювати та керувати електричними ланцюгами для обладнання та освітлювальних приладів у Revit.",
        steps: [
            { description: "Виберіть обладнання або прилад для підключення.", timestamp: "0m15s" },
            { description: "Натисніть на вкладку 'Power' (Живлення), щоб створити новий ланцюг.", timestamp: "0m30s" },
            { description: "Виберіть панель (щит), до якої буде підключено ланцюг.", timestamp: "0m45s" },
            { description: "Відредагуйте шлях прокладання дроту за допомогою інструментів 'Arc' або 'Chamfer'.", timestamp: "1m10s" },
            { description: "Перевірте навантаження та параметри ланцюга в 'System Browser'.", timestamp: "1m35s" }
        ],
        videoId: "https://www.youtube.com/watch?v=n4r9p63-a_I",
        software: "Revit"
    },
    {
        id: "w2",
        title: "Координація систем ОВК та Електро",
        description: "Як виявляти та вирішувати колізії між повітропроводами системи опалення, вентиляції та кондиціонування (ОВК) та електричними лотками.",
        steps: [
            { description: "Запустіть інструмент 'Interference Check' на вкладці 'Collaborate'.", timestamp: "0m22s" },
            { description: "Встановіть категорії для перевірки: 'Ducts' та 'Cable Trays'.", timestamp: "0m40s" },
            { description: "Проаналізуйте звіт про колізії.", timestamp: "1m05s" },
            { description: "Використовуйте інструмент 'Align' (AL) для коригування висоти лотків або повітропроводів.", timestamp: "1m30s" },
            { description: "Повторно запустіть перевірку, щоб підтвердити вирішення колізії.", timestamp: "2m00s" }
        ],
        videoId: "https://www.youtube.com/watch?v=d_k3d5g_z0s",
        software: "Revit"
    },
    {
        id: "w3",
        title: "Створення 3D-моделі з 2D-креслень",
        description: "Крок за кроком процес імпорту 2D-креслення з AutoCAD та створення на його основі 3D-моделі в SketchUp.",
        steps: [
            { description: "Імпортуйте DWG/DXF файл: 'File' > 'Import'.", timestamp: "0m10s" },
            { description: "Використовуйте інструмент 'Line' (L), щоб обвести контури стін.", timestamp: "0m50s" },
            { description: "Використовуйте 'Push/Pull' (P) для надання об'єму стінам.", timestamp: "1m25s" },
            { description: "Створіть компоненти для вікон та дверей для повторного використання.", timestamp: "2m10s" }
        ],
        videoId: "https://www.youtube.com/watch?v=O57B4A8iIuM",
        software: "SketchUp"
    },
    {
        id: "w4",
        title: "Налаштування динамічних блоків",
        description: "Як створювати та налаштовувати динамічні блоки в AutoCAD для підвищення ефективності.",
        steps: [
            { description: "Створіть геометрію блоку.", timestamp: "0m30s" },
            { description: "Відкрийте редактор блоків командою 'BEDIT'.", timestamp: "1m00s" },
            { description: "Додайте параметри (наприклад, 'Linear', 'Rotation') з палітри 'Block Authoring'.", timestamp: "1m45s" },
            { description: "Додайте дії (наприклад, 'Stretch', 'Rotate') та прив'яжіть їх до параметрів.", timestamp: "2m30s" },
            { description: "Збережіть та протестуйте блок.", timestamp: "3m15s" }
        ],
        videoId: "https://www.youtube.com/watch?v=M-b_Lcr33vE",
        software: "AutoCAD"
    }
];

export type UserNote = {
    id: string;
    title: string;
    content: string;
    category: string;
    imageUrl?: string;
    createdAt: Timestamp | Date | any; 
    updatedAt: Timestamp | Date | any;
    userId: string;
};

export type Category = {
    id: string;
    name: string;
    userId: string;
}
