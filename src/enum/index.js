/**
 * 目前舞台只支持四种层级
 */
export const STAGE_LAYER_GROUPS = {
    // 背景层
    BACKGROUND_LAYER: 'background',
    // video 层
    VIDEO_LAYER: 'video',
    // 画笔层
    PEN_LAYER: 'pen',
    // 角色层
    SPRITE_LAYER: 'sprite',
};

/**
 * 缩放方向
 */
export const ZOOM_DIRECTION = {
    // 默认，上-左方向
    DEFAULT: 'TOP_LEFT',
    // 上-左方向
    TOP_LEFT: 'TOP_LEFT',
    // 上-右方向
    TOP_RIGHT: 'TOP_RIGHT',
    // 下-右方向
    BOTTOM_RIGHT: 'BOTTOM_RIGHT',
    // 下-左方向
    BOTTOM_LEFT: 'BOTTOM_LEFT',
}

/**
 * 方向 cursor（鼠标指针）
 */
export const DIRECTION_CURSORS = {
    // 默认，上-左方向
    DEFAULT: 'nwse-resize',
    // 上-左方向
    TOP_LEFT: 'nwse-resize',
    // 上-右方向
    TOP_RIGHT: 'nesw-resize',
    // 下-右方向
    BOTTOM_RIGHT: 'nwse-resize',
    // 下-左方向
    BOTTOM_LEFT: 'nesw-resize',
};