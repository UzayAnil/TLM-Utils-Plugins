import {isEmpty} from "../utils/string";

export var addRibbonMenu = {
    is_tlm_add_menu: true,
    icon: 'fa-chart-line',
    name: '生成函数飘带',
    condition: {modes: ['edit'], method: () => (Format.id === "bedrock_old")},
    click: function (group) {
        new Dialog({
            title: "输入函数飘带参数",
            lines: [
                "函数表达式举例：<br>",
                "sin 函数：<font color='#ff7f50'>Math.sin(x)</font> ",
                "cos 函数：<font color='#ff7f50'>Math.cos(x)</font> ",
                "tan 函数：<font color='#ff7f50'>Math.tan(x)</font><br> ",
                "二次函数：<font color='#ff7f50'>x*x+2*x+1</font> ",
                "反 cos 函数：<font color='#ff7f50'>Math.acos(x)</font> ",
                "对数函数：<font color='#ff7f50'>Math.log(x)</font><br> "
            ],
            form: {
                func: {
                    type: "input",
                    label: "函数表达式",
                    placeholder: "使用 JS 函数表达式，自变量为 x"
                },
                start: {
                    type: "number",
                    label: "起始 x 值",
                    value: 0, min: -100, max: 100,
                },
                end: {
                    type: "number",
                    label: "终止 x 值",
                    value: 5, min: -100, max: 100,
                },
                width: {
                    type: "number",
                    label: "飘带宽度",
                    value: 5, min: 1, max: 50, step: 1
                }
            },
            onConfirm: function (formData) {
                // 检查函数是否为空
                if (isEmpty(formData.func)) {
                    Blockbench.notification("函数为空", "请输入一个函数表达式！");
                    return;
                }

                // 检查参数长度
                if (Math.abs(formData.start - formData.end) < 1) {
                    Blockbench.notification("参数过近", "起始和终止坐标差值过小！");
                    return;
                }

                // 检查表达式
                try {
                    let a = customFunction(formData.start, formData.func);
                    let b = customFunction(formData.end, formData.func);
                    if (Math.abs(a) > 100 || Math.abs(b) > 100) {
                        Blockbench.notification("函数超限", "起始或终止坐标距离过远！");
                        return;
                    }
                } catch (e) {
                    cl(e);
                    Blockbench.notification("表达式错误", "函数表达式计算出错，请检查其书写正确性！");
                    return;
                }

                // 生成对应内容
                try {
                    // 防止玩家写反起始和终点
                    let start = Math.min(formData.start, formData.end);
                    let end = Math.max(formData.start, formData.end);
                    addRibbon(group, formData.func, start, end, formData.width);
                } catch (e) {
                    Blockbench.notification("生成错误", "请检查函数表达式书写正确性！");
                } finally {
                    this.hide();
                }
            }
        }).show()
    }
};

function customFunction(x, func) {
    return eval(`let x = ${x}; ${func};`);
}

function round(x, y) {
    return Math.sqrt(x ** 2 + y ** 2)
}

function addRibbon(rootGroup, func, start, end, width) {
    let startPos = [start, customFunction(start, func)];
    if (!rootGroup) {
        rootGroup = addRibbonGroup(undefined, [0, 0, 0], [0, 0, 0])
    }
    genNodeGroup(rootGroup, func, startPos, end, width);
    Canvas.updateAll();
}

function genNodeGroup(rootGroup, func, startPos, end, width) {
    let next = intersection(startPos[0], startPos[0] + 1, startPos, func);
    let deg = Math.radToDeg(Math.atan((next[1] - startPos[1]) / (next[0] - startPos[0])));
    let group = addRibbonGroup(rootGroup, [startPos[0], startPos[1], 0], [0, 0, deg])
    addRibbonCube(group, [startPos[0], startPos[1], 0], [1, 0, width])
    if (next[0] <= end) {
        genNodeGroup(rootGroup, func, next, end, width);
    }
}

/**
 * 二分法查找交点
 */
function intersection(x1, x2, origin, func) {
    let middleX = (x1 + x2) / 2;
    let middleY = customFunction(middleX, func);
    let distance = round(middleX - origin[0], middleY - origin[1]) - 1;
    if (distance > 0.0005) {
        return intersection(x1, middleX, origin, func);
    } else if (distance < -0.0005) {
        return intersection(middleX, x2, origin, func);
    } else {
        return [middleX, middleY];
    }
}

function addRibbonGroup(selectedGroup, pivot, rotation) {
    let baseGroup = new Group({
        origin: [pivot[0], pivot[1], pivot[2]],
        rotation: [rotation[0], rotation[1], rotation[2]]
    });
    baseGroup.addTo(selectedGroup);
    baseGroup.createUniqueName();
    baseGroup.init();
    return baseGroup;
}

function addRibbonCube(selectedGroup, start, size) {
    // 方块构建
    let baseCube = new Cube({
        autouv: (settings.autouv.value ? 1 : 0)
    }).init();
    baseCube.addTo(selectedGroup);
    // 方块参数设置
    if (Format.bone_rig) {
        if (selectedGroup) {
            baseCube.extend({
                from: [start[0], start[1], start[2]],
                to: [start[0] + size[0], start[1] + size[1], start[2] + size[2]],
                origin: selectedGroup.origin.slice()
            });
        }
    }
}