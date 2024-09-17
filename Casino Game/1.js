window.requestAnimFrame = (function(){
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();


/**
 * Отображение счета
 * @param label - подпись
 * @param x
 * @param y
 * @param width
 * @param height
 * @param figures - количество знаков
 * @param value
 * @constructor
 */
var Display = function(label, x, y, width, height, figures, value) {
    this.x = x;
    this.y = y;
    this.figures = figures || 1;
    this.width = width;
    this.height = height;
    this.label = label.toUpperCase();
    this.value = value;
};

Display.prototype = {
    /**
     * Метод отрисовки
     * @param ctx
     * @param value
     */
    draw: function(ctx, value) {
        ctx.save();

        var borderWidth = 3,
            paddingWidth = 8,
            offsetWidth = 6,
            figureWidth = (this.width - borderWidth - paddingWidth*2 - offsetWidth*(this.figures-1))/this.figures,
            borderGradient = ctx.createLinearGradient(0, 0, 0, this.width);

        borderGradient.addColorStop(0, "#454545");
        borderGradient.addColorStop(1, "#686868");

        ctx.clearRect(this.x, this.y, this.width, this.height);

        // параметры подписи
        var fontSize = 10;
        ctx.fillStyle = '#606060';
        ctx.font = "bold " + fontSize + "px Tahoma, sans-serif";

        // позиция по центру
        var textSize = ctx.measureText(this.label),
            textX = this.x + (this.width/2) - (textSize.width / 2),
            labelHeight = fontSize + 8;

        // рисуем подпись
        ctx.fillText(this.label, textX, this.y);

        // рисуем циферки с фоном и рамками
        ctx.fillStyle = '#210808';
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = borderWidth;

        // рисуем рамку со скругленными углами
        this._drawRoundedRect(ctx, this.x + borderWidth/2, this.y + labelHeight - borderWidth/2, this.width - borderWidth, this.height - labelHeight - borderWidth, 2);

        this.value = '' + value;
        var j = this.value.length - 1;
        var currentSymbol;

        // начинаем с последней ячейки
        for (var i = this.figures - 1; i >= 0; i--) {
            currentSymbol = false;

            // подбираем текущий символ для отображения
            while (currentSymbol === false) {
                if (this.value[j] === undefined) {
                    break;
                }

                if (this._figures[this.value[j]] !== undefined) {
                    currentSymbol = this._figures[this.value[j]];
                }

                j--;
            }

            this._drawFigure(
                ctx,
                this.x + borderWidth/2 + paddingWidth + (figureWidth + offsetWidth)*i,
                this.y + labelHeight - borderWidth/2 + paddingWidth,
                figureWidth,
                this.height - labelHeight - borderWidth - paddingWidth*2,
                currentSymbol
            );
        }

        ctx.restore();
    },

    /**
     * Рисуем рамку со скругленными углами
     * @param ctx
     * @param x
     * @param y
     * @param width
     * @param height
     * @param radius
     * @private
     */
    _drawRoundedRect: function(ctx, x, y, width, height, radius) {
        radius = radius || 5;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();
    },


    /**
     * Рисуем циферку
     * @param ctx
     * @param x
     * @param y
     * @param width
     * @param height
     * @param figure
     * @private
     */
    _drawFigure: function(ctx, x, y, width, height, figure) {
        var segmentParams,
            lineWidth = Math.floor( width / 4);

        // рисуем фон
        ctx.fillRect(x, y, width, height);

        // рисуем циферку
        if (figure !== false) {
            for (var i = 0, sl = figure.length; i < sl; i++) {
                if (this._segmentParams[figure[i]] !== undefined && Object.prototype.toString.call(this._segmentParams[figure[i]]) === "[object Function]") {
                    segmentParams = this._segmentParams[figure[i]].call(this, x, y, width, height, lineWidth);

                    this._drawSegment(ctx, segmentParams.x, segmentParams.y, segmentParams.width, segmentParams.height);
                }
            }
        }
    },


    /**
     * Рисуем кусок цифры
     * @param ctx
     * @param x
     * @param y
     * @param width
     * @param height
     * @private
     */
    _drawSegment: function(ctx, x, y, width, height) {
        ctx.save();

        var shortSide = height < width ? height : width,
            halfShortSide = shortSide/2;

        ctx.fillStyle = '#ff8484';

        // рисуем восьмиугольник
        // в зависимости от направления некоторые углы будут сливаться
        ctx.beginPath();
        ctx.moveTo(x + halfShortSide, y);
        ctx.lineTo(x + width - halfShortSide, y);
        ctx.lineTo(x + width, y + halfShortSide);
        ctx.lineTo(x + width, y + height - halfShortSide);
        ctx.lineTo(x + width - halfShortSide, y + height);
        ctx.lineTo(x + halfShortSide, y + height);
        ctx.lineTo(x, y + height - halfShortSide);
        ctx.lineTo(x, y + halfShortSide);
        ctx.fill();

        ctx.restore();
    },

    /**
     * Отступ между сегментами чтоб не сливались
     */
    _offset: 3,


    /**
     * По переданным координатам ячейки возвращает координаты отрисовки сегментов
     */
    _segmentParams: {
        'top': function(x, y, width, height, lineWidth) {
            return { x: x + this._offset, y: y, width: width - this._offset*2, height: lineWidth }
        },
        'topRight': function(x, y, width, height, lineWidth) {
            return { x: x + width - lineWidth, y: y + this._offset, width: lineWidth, height: height/2 - this._offset }
        },
        'center': function(x, y, width, height, lineWidth) {
            return { x: x + this._offset, y: y + height/2 - lineWidth/2, width: width - this._offset*2, height: lineWidth }
        },
        'bottomRight': function(x, y, width, height, lineWidth) {
            return { x: x + width - lineWidth, y: y + height/2, width: lineWidth, height: height/2 - this._offset }
        },
        'bottom': function(x, y, width, height, lineWidth) {
            return { x: x + this._offset, y: y + height - lineWidth, width: width - this._offset*2, height: lineWidth }
        },
        'bottomLeft': function(x, y, width, height, lineWidth) {
            return { x: x, y: y + height/2, width: lineWidth, height: height/2 - this._offset }
        },
        'topLeft': function(x, y, width, height, lineWidth) {
            return { x: x, y: y + this._offset, width: lineWidth, height: height/2 - this._offset }
        }
    },


    /**
     * Цифекри
     */
    _figures: {
        '0': [ 'top', 'topRight', 'bottomRight', 'bottom', 'bottomLeft', 'topLeft' ],
        '1': [ 'topRight', 'bottomRight' ],
        '2': [ 'top', 'topRight', 'center', 'bottomLeft', 'bottom' ],
        '3': [ 'top', 'topRight', 'center', 'bottomRight', 'bottom' ],
        '4': [ 'topLeft', 'topRight', 'center', 'bottomRight' ],
        '5': [ 'top', 'topLeft', 'center', 'bottomRight', 'bottom' ],
        '6': [ 'top', 'topLeft', 'center', 'bottomRight', 'bottom', 'bottomLeft' ],
        '7': [ 'top', 'topRight', 'bottomRight' ],
        '8': [ 'top', 'topRight', 'center', 'bottomRight', 'bottom', 'bottomLeft', 'topLeft' ],
        '9': [ 'top', 'topRight', 'center', 'bottomRight', 'bottom', 'topLeft' ]
    }
};


/**
 * Кнопочки
 * @param text - подпись
 * @param x
 * @param y
 * @param width
 * @param height
 * @constructor
 */
var Button = function(text, x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hovered = false;
    this.text = text;
    this.handlers = [];
};

Button.prototype = {
    /**
     * Вхождение курсора в область кнопки
     * @param obj
     * @param mouse
     * @returns {boolean}
     */
    intersects: function(obj, mouse) {
        var xIntersect = mouse.x > obj.x && mouse.x < obj.x + obj.width;
        var yIntersect = mouse.y > obj.y && mouse.y < obj.y + obj.height;
        return xIntersect && yIntersect;
    },


    update: function(ctx) {
        this.hovered = this.intersects(this, ctx.mouse);
    },


    draw: function(ctx) {
        ctx.save();

        // определяем цвет фона
        ctx.fillStyle = this.hovered ? '#ccc' : '#fff';

        // рисуем фон
        this._drawRoundedRect(ctx, this.x, this.y, this.width, this.height, 4);
        ctx.fill();

        // задаем параметры текста
        var fontSize = 20;
        ctx.fillStyle = '#000';
        ctx.font = fontSize + "px sans-serif";

        // вычисляем позицию текста по центру
        var textSize = ctx.measureText(this.text),
            textX = this.x + (this.width/2) - (textSize.width / 2),
            textY = this.y + (this.height/2) - (fontSize/2);

        // рисуем текст кнопки
        ctx.fillText(this.text, textX, textY);

        ctx.restore();
    },


    /**
     * Метод вызова подписчика события
     * @param e
     * @param type
     */
    handle: function(e, type) {
        if (this.handlers && this.handlers.length) {
            for (var i = 0, hl = this.handlers.length; i < hl; i++) {
                if (this.handlers[i].type === type && Object.prototype.toString.call(this.handlers[i].handler) === "[object Function]") {
                    this.handlers[i].handler.call(this, e);
                }
            }
        }
    },

    /**
     * Простенькая реализация подписки на события
     * @param type
     * @param handler
     * @returns {Button}
     */
    on: function(type, handler) {
        this.handlers.push({
            type: type,
            handler: handler
        });

        return this;
    },


    /**
     * Рисуем прямоугольник со скругленными углами
     * @param ctx
     * @param x
     * @param y
     * @param width
     * @param height
     * @param radius
     * @private
     */
    _drawRoundedRect: function(ctx, x, y, width, height, radius) {
        radius = radius || 5;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
};


var Slot = function(options, canvasNode) {
    var i, j;

    // enums
    this.states = {
        REST: 0,
        BET: 1,
        SPINUP: 2,
        SPINDOWN: 3,
        REWARD: 4
    };

    var defaultOptions = {
        icons: [
            // порядок в массиве должен совпадать с порядком на изображении
            {
                id: '7',
                name: 'Семерка',
                count: 1    // количество на барабане
            },
            {
                id: 'C',
                name: 'Вишенка',
                count: 1
            },
            {
                id: '3',
                name: 'Три золотых слитка',
                count: 1
            },
            {
                id: '1',
                name: 'Золотой слиток',
                count: 3
            },
            {
                id: '2',
                name: 'Пара золотых слитков',
                count: 2
            }
        ],
        rulesScoring: [
            function(line, bet) {
                var score = [2, 4, 6][bet-1];
                // За каждую вишенку по n
                return +(line[0].id === 'C' && score)+(line[1].id === 'C' && score)+(line[2].id === 'C' && score)
            },
            function(line, bet) {
                var score = [5, 10, 15][bet-1];
                // Серия из слитков произвольного значения
                return +(
                    (line[0].id === '1' || line[0].id === '2' || line[0].id === '3') &&
                    (line[1].id === '1' || line[1].id === '2' || line[1].id === '3') &&
                    (line[2].id === '1' || line[2].id === '2' || line[2].id === '3') &&
                    score
                )
            },
            function(line, bet) {
                var score = [25, 50, 75][bet-1];
                // 1, 1, 1
                return +(line[0].id === '1' && line[1].id === '1' && line[2].id === '1' && score)
            },
            function(line, bet) {
                var score = [50, 100, 150][bet-1];
                // 2, 2, 2
                return +(line[0].id === '2' && line[1].id === '2' && line[2].id === '2' && score)
            },
            function(line, bet) {
                var score = [100, 200, 300][bet-1];
                // 3, 3, 3
                return +(line[0].id === '3' && line[1].id === '3' && line[2].id === '3' && score)
            },
            function(line, bet) {
                var score = [300, 600, 1500][bet-1];
                // 7, 7, 7
                return +(line[0].id === '7' && line[1].id === '7' && line[2].id === '7' && score)
            }
        ],
        iconsUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAKKCAYAAADbWiU/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2OWZmNThiNi0xNmRiLWNhNDUtYmNlYi1lZTkzYjBiMzI5NDUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RUI0MjRGREY2NUMxMTFFNTg5QTlDQjBBQzAwODY2Q0MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RUI0MjRGREU2NUMxMTFFNTg5QTlDQjBBQzAwODY2Q0MiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTk5MWYwMDItZDFkOC01YzRjLWE4OTUtM2NmYjhlM2Y0MGYyIiBzdFJlZjpkb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6MmI4ZGVkMmYtNjVjMS0xMWU1LTk0Y2Mt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",
        reelBgUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAI4AAADKCAYAAABzNHhyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjZjhjZjc1OS1iNmQ0LTQ5NGYtYmI0My1hYTIwODU2N2I2NjUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEEzQUJFRDc2NUU1MTFFNUI1QzhDMkMzMTVEMDM0QTAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEEzQUJFRDY2NUU1MTFFNUI1QzhDMkMzMTVEMDM0QTAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTZiZGVhMzQtZWZmNi1kOTQ0LWIxMTYtM2QwMWQ0ODAzYzA5IiBzdFJlZjpkb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NThlZGIwMzEtNjVkMC0xMWU1LTk0Y2MtODY4ZDUzZjVlZDkyIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+zeCyCQAAD59JREFUeNrsncuKHEcWhjMjsy59kdSW1N3GWtgbCcYM9iwtzIA32thgMPMEfgrjJ/Ar+B28MAi0MgwG7waGgREyeBCW8AXR7Xa1Ln2pqrzUnD87ohxVqltGtT3Tp/4fjrNaVIUh4+M/52RkRsbvvvvu4Pr16xFFLaqDg4PIEBqqrsBMGscxzwRVWyPgfPnllzwj1FR99NFHk8GhqFnyWSE41LmDU0r8Q+LfEnsSHYnnEqcSOU+jPi4kDJiQ2JL4q8TfJJK64PxT4l8SLywsxxJHEicER6WMhQTgZBL3JBoobeqC8x87QM+C4+Ch4+gGB7AU9t/+PhWcJEmmDXRsAel78HSt45Q8zypTVepBAzCe+l/wWZnlOIUFJ/ecp28/FzzPKsEpPWga45ll0VQ1sAMVFhgHEMHRm6rcsbBRLgtO4X0umarUauDNe2k/TwbHGLPIQINJA1ErZkkeK/McZxyeAeFZ4SKoRqpykNBtqFpLDgM6DhXqOCWhoUKK45LwUHWKY19swalRx1nAbYpZvT2lRrXq2Xm3VbjIx+ChdKqcELWL4zIavVqcRxMuQ1NqwXnJceqAU4wB45YfKJ2pysya67o1zvh6FR1nRR1npMaZM0gx5jp0nNVwnLlzPQsc98Ms+u2+HIKjH5zx2ra+40hOG0lV8ndOcPQ7zmAwGJYl8jkoVeUCS+U4xphMIk/TlPcbK1RRFKYsy1hASSRyBOa9NjgCDBymchoBBpFfunSpaLfbdByFyvN8cHJykvT7/aK0Emjqpyqbpqr0hGi1WsWVK1fyjY0NgqNQvV5vYFNUIZ+daYTVOMh7znmazWYp4JRbW1tsxxXqxYsXgKeUlFVFlmWDUHAGXicF1ykEmnx7e5vgKC2OO53OyMW/oFRloSm9CrtYX18vCY5OHR8fV+UJYBHHGVho6oODX8JlAI7USYUUTdVAOzs7BEehHj9+XKUqzLMtjAdBjoMfIUAhwJGKu/jhhx/K999/n+AolMxt9Msvv1T1jddRBS05DGyqqujDWPfv36+Cp1mPPv/8c3++F74fx8wDJ+LtolQAOHy6gaqXqpIkMVLfGFFy6dKl9I033kg//vjj9IMPPmCNo0iffPJJdbx37565e/duKrVOenBwkJ6enuIqcpJlWT1wpPVONzY2Gq+88kpToGndvn279c477wwuX75McBRK5tYIJM2HDx82Hz161N7f3293Op3W999/Xw+c3d3d1tWrV9s3btxYu3Xr1uZbb71VvPbaaw2BieAolMytefvttxuSXZpXrlxZ+/HHHzeePHmyMRWcaaufr776amtnZ6f9+uuvb9y8efNUQBoINM1Wq0VwFErm1mxvbze63W4zz/O2lCjrUq5sjBS9HitTHefatWvt69evrwsw6zLgpqQs1D3NiLeOqhRq2s3NzXRra6t5dHTUlhpnTSDamFocT3McuItYVlOsq70mwup4o9FI2F3plMxtnKZpo91uN2S6qzkXBtq1HQe5TghsyxED9GRgrGX0CY5OydzG4joNSOBpARqJ9dqOI8ClEhikKQO2hUYsdhqCo5edFJZzphbUFE11nGngyG8S+W0ix1SOeP4Kg8QER7XpYJ4rcsAQonaqcsCgIJYBmvaOQDqOYnCis+2LqzlHiBq1UxV+JEL73ZTWrI2n+JAGCY5eu4HjyFwjYBYtRG3HQQflLAuSweg4ytlJzoRSp8oymPfajoO+Hi0ajvjTnO2qQ8fRnaoSF958T3QcM8O6hiviMgZhoRZzHDoL9RIQi9Q49hZC/Ce34TYfIFBKU5XMsQPEyPwn9mnOeo6TWwEaO0BGcNTXOAM84YDHgQGORF7bcQCM/DBDyA9cEBy9aSge/KbYuk5a23H6/X4ukYnp9GUAPB/ao+Podhw8CoUQoVSJsyxLaztOH9RkWQ/QCDwAp0tw1IOTylw3cLuoTH8sn5PajtPtdrNer9eXH3cBDQCydQ7BUQqOzHEDTRDqHIAj8z/1Os4scPonJyd9+XEXkgEBEMFRXOOgrhVgGti5QqY8lkhqpyqAIwP0jo+PUePAcbrosrBrBU+zPsnUohgu5IjHvZGqjDBQf8kBwIjjdOXYxVHGPLVdFcHR6ThVFyWwFKenp5HMeSzHtHaqOjo66r948aInx64USzLOSU+sLCM4OiVza2SOcbN6gb1yJMzz588bIeD0nj592pMfdw8PD3u7u7unuKZDcHQKF/0EmlyAKWTO42fPns0GZ9pA8qNsbW2t/+uvv/ZkkK7YVpfg6AZH5hjQlGIYsZhFItGqXeMgVbVarX6n0+nt7+/3BZ4eLu0QHJ1CMSxzXMpcY7uTRAyjIQD1pzqOW9galwyCQrjfaDT6W1tbve3t7f7Nmzf7BEenxCjM48ePBz///HP0008/JXt7ew2BJxurg+Y7juS67OzicdZP07RynzfffBPwEByFEmDMgwcPou+++y5+8uRJX9IUHszLatc46Okl5+XYulRa8kJsCxtH5u+99x7BUaivv/7afPPNN0acJkGBLIbhdlivV+NgBy4ccF+O0FdIlPfv3y+//fZbgqNIX3zxxci0RzNedLZQOx6NvrB+4o+p1dKi4Mz9MbW64Mzbyo2i6tU408Ch49BxFklVA9Y4VGhxTMehatU4rHOooBpnYrqi49Bx2I5Tv1s7Tkqo4FRFx6GYqii249T/eTtOUqjgGoftOMVFTur3d5wBaxwqpMahqMmOM+0ph2mus8D3KaXy5541DvW7dlWscSjWOBQdh/ofOU5apzCGvvrqK55BaqbjuH39Uxt4qu+lh7QoNTLeXKfe/E92HPfHBICwN0rTCygmOKrBaU6IkXYcr58agjPFdVIPnhbBWQlwGnauHTQvbayEADxDcOY4TssbnODoB6c113FE0wY6lDiQ2Jd4JoF9jvt37twhOIrkNTvGMwm8/XcT8+1/13+3K6/jUGFdFfa0hQVNSFU3LFgg78jSlwmhdBzdqQq20rauc8n/AraxRarCy/NS92HC4mVmYem7NGX/jeDoBQdzO/Ba85FU5VipimNX7Jy9gnHkS9gDMJdjBZAcK3Dsa6QpZcIG2WeHKvPgJWdwn3xkfcpCMwKOO05yHAtNDxARHL2OI5CU4ECOCV5cL8cRx3HmMgTHfnkSOLkFp0pV2IHUvkaaUibsrJ5l2cC6T2LrnWw8VQ3b8RmOk1unqUJasd7Vq1exdS3BUainT5+aTqeD1w2BBVzfa2D+x1PVsKuaAIwDCbZVJklSXL58udjd3S0+/PDD4tNPPyU4CvXZZ58N7t69W+zt7eFdDth0tkTqGnecITg1iqcqeOuo2uK41i0zs8CJ/UFDBqcuFjj+MRic2EoKYrO5uRlfu3Yt3tnZwev3Yp5mfcLcYo6Pj4/xEle8HS+elV2YqqhzT1WV8fgWBmjwamFKZTt+fuAgVbVarXhjYyOWzqoK+R8wVSmUm1/M9enpKUqSCCkrOFWBwjzPq3xHx9HtOOOuM8uB0gUGjJmqVidVLVrHzuqqjChuNptVulpfX4/b7Ta7KqXC3GKO19bWqvlGlkEslap8Euk4+h1nEddJ50HjfyY4+sHxgQmtcUyaprgAWFkXrAyfmap0CnOLOUbIfEe4AIj5x6InUxW1cKoKdpz4rDqOfddJkoSOo1SYW8wxmiEE5lzcJrg4jlnjrF6N47tPCDixb10IQENwdArzWme9al6qqgTbQspC6prV21MXV64sQZpycz3+AMNC4Ah5wwVOZ19MVbpT1aQCOcRxqntMUTSBQAT+mY6jVs5xqjl3EVwc+604HWc1HMdvhoKLYyxy+h2VOA7PstLi2C9JgotjgOPsCnUyjqh7eD+OTmFu/RRli+OgVBU7t3GtGh1nNdrxpYpj6zjGJxD/xivHeotj5zK2Na8uyQQVx5Mu/tFx9DqO7zrL3FZhLHHVDV0QUtes+1CpC91VuSeihq4T6jgvPeHAdnw12vGlV8cBX+wJ9Q0vAKpNVfG4QpcchoH0xBpnNWqcRZcd5j4C7OTaczqO3hpnwrTHIY5TXfBz7uOIZI2zGl3VMoucVX2DveFcpU3H0e047lqdc57Iu5EvqMaxz9hELih9cnN7LjVOdLZtKaK6kkjH0e04dpd9102FX8dxduUvN3DJQW877tKUXyQHgeMKZLtzwTAofXJzey43qyNNwcIEHAMicT1n1iMT1IUGp8omri2f9/1ZxbHxABp2VFyrUlscu9to3GWY4eWY2o4DpwFA9jpOBU2v1yM4ih0H4d2wFwSO66gim67oOModx0Hju84yNU5V54jTGNQ39mkHSpkwt851xuAJ6qqqWgfw0HFWx3G81nyprsp1VhU0s561ofTUOMGOY4vi6qqx0Ig3ixg6jn7HcS25ezQqNFUhRQ1TFaCZ9cgEdbEdB/B461ThxbF7ftzVN/biH8FRWhw713GlSfBWbtHZW9OMu3LMW0f1ys2vl6qCu6rIAlNBI0QaW98QHKWpyqUrH56Q4tg9ElO5jiuMZw1GXfziGMAs6zju0rNxgxEc3eD4juPa8tAaJ/HuN3ZVN8FRWuO4otjfMyAoVdl6pqpzHJHcrUIvOG5+XURLrFXF4x0VwdEpfyH7PFKVcWtVuHLs7VpBKQTHv5lr2QuAxnVW7m0iBEe341hwhs1RaDvuLgAOt6qddQMzdXGF+V40Tc1NVe5aDo5IVfO2vqAuNjhjq+NR8HUc244nOMJ9UCiTG7XgoBwZ1rWRdwdoXXBSCw6OKQCSgZOISw5aBWASC03ifQ6qcSq38QFCy89zrNNxvLk23t+1HSexXRXcpmEHSek46h3HGUQaCo7xaxybrlKeX73gOMdxphFU4zi3sd9pWNfh87+6wfGdJrWmEdSOu/Tk0zjgOVbtOOPH+jWOF3NzHnXhFXvzvHyNgzTlBYvj1QDHN40gxzGe4xg6jnpwkgkR5Dg+gc516DirkaqWdpzxvEfpBseva5dynHHnYVelFxy/ew5eqzIToCE4rHFqgeMXyQRHPzhLrY6bCXUO/i55jlfGcYLA8fc5Tsbac7qO3hrHnIfjmAkUlgRHNTjjx6Udxx0LgqPecXx4prrKIgPyoh9VG5zIA4cQUQuB4+/vb3i6qLqpim5DLQxOPMF1CA61cKqKCAx1Hu24YTuu1kTGW/LwbU6il2+t4D05OjW+VhW85OAvbOLYjHhPjnbHGb8XJ2h1vB2dPQ7j33MMeMqI61VawRnPLpsh4NyQeGi/07LhXgHMZQfdqcqVJH8JAeeWheORdZ41C0xsASI4+sBx6QpO82eJ26E1zp9sUNRLcFAUwaH+oLx2584d1ioUHYf6g8DpdDo8C1QtHR4eRv8VYAALWHlTfytthwAAAABJRU5ErkJggg==",
        soundWinUrl: "sounds/win.wav",
        soundReelStopUrl: "sounds/reel_stop.wav",
        reelCount: 3,           // количество барабанов
        reelBorderWidth: 6,
        reelOffset: 30,         // расстояния между барабанами
        symbolSize: 130,        // размер тайла иконки
        maxReelSpeed: 65,       // максимальная скорость раскрутки барабанов
        minStopDelay: 300,      // минимальная задержка остановки барабана, мс
        maxStopDelay: 800,      // максимальная задержка остановки барабана, мс
        spinUpAcceleration: 5,  // скорость раскрутки барабанов
        spinDownAcceleration: 1,// скорость остановки барабанов
        startingCredits: 100,   // начальная сумма на счету
        animateFiguresDelay: 3,         // сколько кадров пропускать во время анимации начисления очков
        animateFiguresDelayGrand: 1,    // сколько кадров пропускать во время анимации начисления большого количества очков
        rewardGrand: 25,        // какую награду считать большой и увеличивать скорость начисления
        animateWinDelay: 10,    // сколько кадров пропускать во время анимации победы
        animateWinReelLightOffCount: 3, // сколько раз мигать во время анимации победы
        reelAreaLeft: 32,
        reelAreaTop: 32,
        reelAreaHeight: 190,
        displays: {
            pays: new Display("Winner paid", 32, 250, 112, 68, 4),
            credits: new Display("Credits", 165, 250, 112, 68, 4),
            bet: new Display("Bet", 310, 250, 36, 68, 1)
        }
    };

    // присваиваем значения "По умолчанию"
    for (var option in defaultOptions) {
        if (defaultOptions.hasOwnProperty(option)) {
            this[option] =  options[option] !== undefined ? options[option] : defaultOptions[option];
        }
    }

    this.ctx = canvasNode.getContext("2d");     // context
    this.ctx.textBaseline = "top";
    this.ctx.mouse = {
        x: 0,
        y: 0,
        clicked: false,
        down: false
    };

    canvasNode.addEventListener("mousemove", this.onMouseMove.bind(this));
    canvasNode.addEventListener("click", this.onClick.bind(this));

    canvasNode.addEventListener("touchend", (function(e) {
        if (e.touches[0]) {
            this.ctx.mouse.x = e.touches[0].pageX - canvasNode.offsetLeft;
            this.ctx.mouse.y = e.touches[0].pageY - canvasNode.offsetTop;

            this.onClick.call(this, e);
        }
    }).bind(this));

    // список кнопок
    this.buttons = [];

    // формируем шаблон для барабана
    var reelTemplate = [];
    for (i = 0; i < this.icons.length; i++) {
        for (j = 0; j < this.icons[i].count; j++) {
            reelTemplate.push(i);
        }
    }

    this.offsetToLine = Math.floor(this.reelAreaHeight / 2) - this.symbolSize;

    // количество иконок на барабане
    this.reelPositions = reelTemplate.length;

    this.reels = [];
    this.reelPosition = [];
    this.reelSpeed = [];
    this.result = [];

    for (i = 0; i < this.reelCount; i++) {
        // перемешиваем элементы шаблона для генерации барабанов
        this.reels[i] = [];
        for (j = 0; j < this.reelPositions; j++) {
            this.reels[i].splice(Math.floor(Math.random() * j), 0, reelTemplate[j]);
        }

        // задаем разное начальное расположение барабанов
        this.reelPosition[i] = Math.floor(Math.random() * this.reelPositions) * this.symbolSize - this.offsetToLine;

        // выставляем стартовую скорость вращения барабанов
        this.reelSpeed[i] = 0;
    }

    // рассчитаем высоту сгенерированного барабана в пикселях
    this.reelPixelLength = this.reelPositions * this.symbolSize;

    // число иконок влезающих в кадр
    this.rowCount = Math.ceil(this.reelAreaHeight / this.symbolSize);
    this.startSlowing = [];

    this.gameState = this.states.REST;
    this.credits = this.startingCredits;
    this.payout = 0;
    this.bet = 1;
    this._animateFiguresDelayCounter = 0;
    this._animateWinDelayCounter = 0;
    this._animateWinReelLightOffCounter = 0;
    this._animateWinDelayToggler = false;

    this.displays.pays.draw(this.ctx, '');
    this.displays.credits.draw(this.ctx, this.credits);
    this.displays.bet.draw(this.ctx, this.bet);

    this.symbols = new Image();
    this.symbols.src = this.iconsUrl;

    this.reelBg = new Image();
    this.reelBg.src = this.reelBgUrl;

    this.soundWin = new Audio(this.soundWinUrl);
    this.soundReelStop = [];
    this.soundReelStop[0] = new Audio(this.soundReelStopUrl);
    this.soundReelStop[1] = new Audio(this.soundReelStopUrl);
    this.soundReelStop[2] = new Audio(this.soundReelStopUrl);

    window.addEventListener('keydown', this.handleKey.bind(this), true);

    var symbolsLoaded,    // флаг загрузки иконок
        reelBgLoaded;     // флаг загрузки фона

    this.symbols.onload = (function() {
        symbolsLoaded = true;
        if (symbolsLoaded && reelBgLoaded) {
            this.renderReel();
            this.renderLine();
            this.start();
        }
    }).bind(this);

    this.reelBg.onload = (function() {
        reelBgLoaded = true;
        if (symbolsLoaded && reelBgLoaded) {
            this.renderReel();
            this.renderLine();
            this.start();
        }
    }).bind(this);
};


Slot.prototype = {

    //---- Render Functions ---------------------------------------------

    /**
     * Отрисовка иконки
     * @param symbolIndex
     * @param x
     * @param y
     * @param {Boolean} [moves=0] во время движения барабанов показываем размытые иконки
     */
    drawSymbol: function(symbolIndex, x, y, moves) {
        var symbol_pixel = symbolIndex * this.symbolSize;
        this.ctx.drawImage(this.symbols, moves ? this.symbolSize : 0, symbol_pixel, this.symbolSize, this.symbolSize, x + this.reelAreaLeft, y + this.reelAreaTop, this.symbolSize, this.symbolSize);
    },


    /**
     * Перерисовка барабанов
     */
    renderReel: function() {
        var reelIndex,
            symbolOffset,
            symbolIndex,
            x, y;

        for (var i = 0; i < this.reelCount; i++) {
            // сохраняем состояние
            this.ctx.save();

            // задаем цвет фона
            this.ctx.fillStyle = '#fff';

            // рисуем фон
            this.ctx.fillRect(this.reelAreaLeft + this.reelBorderWidth*(i+1) + (this.symbolSize + this.reelBorderWidth)*i + this.reelOffset*i, this.reelAreaTop + this.reelBorderWidth, this.symbolSize, this.reelAreaHeight);

            // ограничиваем область отрисовки
            this.ctx.beginPath();
            this.ctx.rect(this.reelAreaLeft + this.reelBorderWidth*(i+1) + (this.symbolSize + this.reelBorderWidth)*i + this.reelOffset*i, this.reelAreaTop + this.reelBorderWidth, this.symbolSize, this.reelAreaHeight);
            this.ctx.clip();

            for (var j = 0; j < this.rowCount + 1; j++) {
                reelIndex = Math.floor(this.reelPosition[i] / this.symbolSize) + j;
                symbolOffset = this.reelPosition[i] % this.symbolSize;

                if (reelIndex >= this.reelPositions) {
                    reelIndex -= this.reelPositions;
                }

                symbolIndex = this.reels[i][reelIndex];

                x = i * (this.symbolSize + this.reelBorderWidth) + this.reelOffset*i + this.reelBorderWidth*(i+1);
                y = j * this.symbolSize - symbolOffset;

                // рисуем иконку
                this.drawSymbol(symbolIndex, x, y, this.reelSpeed[i] > this.maxReelSpeed/4);
            }

            // сбрасываем состояние
            this.ctx.restore();

            // накладываем сверху картинку барабана
            this.ctx.drawImage(this.reelBg, this.reelAreaLeft + (this.symbolSize+this.reelBorderWidth*2)*i + this.reelOffset*i, this.reelAreaTop);
        }
    },


    /**
     * Перерисовка линии
     */
    renderLine: function() {
        this.ctx.save();

        // параметры линии
        this.ctx.fillStyle = '#a52325';
        this.ctx.strokeStyle = '#4d0000';
        this.ctx.lineWidth = 1;

        // обводка линии
        this.ctx.strokeRect(this.reelAreaLeft, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) - 0.5, this.symbolSize*3 + this.reelOffset*3 + this.reelBorderWidth, 3);

        // рисуем левый треугольник
        this.ctx.beginPath();
        this.ctx.moveTo(this.reelAreaLeft - 2, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) - 10);
        this.ctx.lineTo(this.reelAreaLeft + 10, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) + 1);
        this.ctx.lineTo(this.reelAreaLeft - 2, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) + 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // рисуем правый треугольник
        this.ctx.beginPath();
        this.ctx.moveTo(this.reelAreaLeft + this.symbolSize*3 + this.reelOffset*3 + this.reelBorderWidth + 2, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) - 10);
        this.ctx.lineTo(this.reelAreaLeft + this.symbolSize*3 + this.reelOffset*3 + this.reelBorderWidth - 10, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) + 1);
        this.ctx.lineTo(this.reelAreaLeft + this.symbolSize*3 + this.reelOffset*3 + this.reelBorderWidth + 2, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2) + 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // заливка линии
        this.ctx.fillRect(this.reelAreaLeft + 1, this.reelAreaTop + Math.floor((this.reelAreaHeight + this.reelBorderWidth)/2), this.symbolSize*3 + this.reelOffset*3 + 4, 2);

        this.ctx.restore();
    },


    /**
     * Перекрытие барабанов темным
     */
    renderReelLightOff: function() {
        // сохраняем состояние
        this.ctx.save();

        // задаем цвет фона
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

        for (var i = 0; i < this.reelCount; i++) {
            // перекрываем барабан
            this.ctx.fillRect(this.reelAreaLeft + this.reelBorderWidth*(i+1) + (this.symbolSize + this.reelBorderWidth)*i + this.reelOffset*i, this.reelAreaTop + this.reelBorderWidth, this.symbolSize, this.reelAreaHeight);
        }

        // сбрасываем состояние
        this.ctx.restore();
    },


    /**
     * Перерисовка
     */
    render: function() {
        if (this.buttons && this.buttons.length) {
            for (var i = 0, bl = this.buttons.length; i < bl; i++) {
                this.buttons[i].draw(this.ctx);
            }
        }

        switch (this.gameState) {
            case this.states.SPINUP:
            case this.states.SPINDOWN:
                this.renderReel();
                this.renderLine();
                break;
            case this.states.REWARD:
                if (this._animateWinReelLightOffCounter > 0) {
                    if (this._animateWinDelayCounter > 0) {
                        this._animateWinDelayCounter--;
                        return;
                    }

                    this.renderReel();

                    if (!this._animateWinDelayToggler) {
                        this.renderReelLightOff();
                    } else {
                        this._animateWinReelLightOffCounter--;
                    } 

                    this.renderLine();

                    this._animateWinDelayToggler = !this._animateWinDelayToggler;
                    this._animateWinDelayCounter = this.animateWinDelay;
                }

                break;
        }
    },


    //---- Logic Functions ---------------------------------------------

    /**
     * Остановка барабанов по очереди через случайные промежутки времени
     * @param i
     */
    setStops: function(i) {
        i = i || 0;

        // начинаем
        window.setTimeout(
            (function(i) {
                this.startSlowing[i] = true;
                if (this.reels[++i]) {
                    this.setStops(i);
                }
            }).bind(this, i),
            Math.floor(Math.random() * (this.maxStopDelay - this.minStopDelay + 1)) + this.minStopDelay
        );
    },


    /**
     * Смещение барабана
     * @param i
     */
    moveReel: function(i) {
        this.reelPosition[i] -= this.reelSpeed[i];

        // повторяем
        if (this.reelPosition[i] < 0) {
            this.reelPosition[i] += this.reelPixelLength;
        }
    },


    /**
     * Логика установки ставок
     */
    logicBet: function() {
        // когда все очки начислены переключаем в режим ожидания
        if (this.displays.credits.value == this.credits && this.displays.bet.value == this.bet) {
            this.gameState = this.states.SPINUP;
            return;
        }

        // пропускаем кадры, чтоб не моргало слишком быстро
        if (this._animateFiguresDelayCounter > 0) {
            this._animateFiguresDelayCounter--;
            return;
        }

        if (this.displays.credits.value != this.credits) {
            this.displays.credits.draw(this.ctx, --this.displays.credits.value);
        }

        if (this.displays.bet.value != this.bet) {
            this.displays.bet.draw(this.ctx, this.displays.bet.value < this.bet ? ++this.displays.bet.value : --this.displays.bet.value);
        }

        this._animateFiguresDelayCounter = this.animateFiguresDelay;
    },


    /**
     * Логика набора скорости
     */
    logicSpinUp: function() {
        for (var i = 0; i < this.reelCount; i++) {
            // перемещаем барабан
            this.moveReel(i);

            // увеличиваем скорость
            this.reelSpeed[i] += this.spinUpAcceleration;
        }

        // как только достигли максимальной скорости начинаем остановку
        if (this.reelSpeed[0] == this.maxReelSpeed) {
            this.setStops();

            this.gameState = this.states.SPINDOWN;
        }
    },


    /**
     * Логика остановки барабанов
     */
    logicSpinDown: function() {
        // когда все барабаны остановлены
        if (this.reelSpeed[this.reelCount - 1] == 0) {
            this.calcReward();
            this.gameState = this.states.REWARD;
        }

        for (var i = 0; i < this.reelCount; i++) {
            if (this.reelSpeed[i] > 0) {
                // перемещаем барабан
                this.moveReel(i);

                /**
                 * не начинаем остановку пока не сработал таймер
                 * @see this.setStops
                 */
                if (this.startSlowing[i]) {
                    // когда скорость падает до минимума крутим барабан до фиксированного положения
                    if (this.reelSpeed[i] === this.spinDownAcceleration) {
                        var positionOffsetToLine = this.reelPosition[i] + this.offsetToLine;

                        if (positionOffsetToLine % Math.floor(this.symbolSize / 2)) {
                            continue;
                        } else {
                            // рассчитываем выпавшие ячейки
                            var stopIndex = positionOffsetToLine / Math.floor(this.symbolSize / 2) + 1;
                            this.result[i] = !(stopIndex % 2) && this.icons[this.reels[i][stopIndex / 2] !== undefined ? this.reels[i][stopIndex / 2] : this.reels[i][0]];

                            try {
                                // проигрываем музыку остановки барабана
                                this.soundReelStop[i].currentTime = 0;
                                this.soundReelStop[i].play();
                            } catch (err) {}
                        }
                    }

                    // уменьшаем скорость вращения
                    this.reelSpeed[i] -= this.spinDownAcceleration;
                }
            }
        }

    },


    /**
     * Логика показа результата
     */
    logicReward: function() {
        // когда все очки начислены переключаем в режим ожидания
        if (this.payout == 0) {
            if (this._animateWinReelLightOffCounter == 0) {
                this.gameState = this.states.REST;
            }

            return;
        }

        // пропускаем кадры, чтоб не моргало слишком быстро
        if (this._animateFiguresDelayCounter > 0) {
            this._animateFiguresDelayCounter--;
            return;
        }

        this.payout--;
        this.credits++;
        this.displays.credits.draw(this.ctx, this.credits);
        this.displays.pays.draw(this.ctx, ++this.displays.pays.value);

        if (this.payout < this.rewardGrand) {
            this._animateFiguresDelayCounter = this.animateFiguresDelay;
        }
        else { // большую сумму анимируем быстрее
            this._animateFiguresDelayCounter += this.animateFiguresDelayGrand;
        }

    },


    /**
     * Логика
     */
    logic: function() {
        if (this.buttons && this.buttons.length) {
            for (var i = 0, bl = this.buttons.length; i < bl; i++) {
                this.buttons[i].update(this.ctx);
            }
        }

        switch (this.gameState) {
            case this.states.BET:
                this.logicBet();
                break;
            case this.states.SPINUP:
                this.logicSpinUp();
                break;
            case this.states.SPINDOWN:
                this.logicSpinDown();
                break;
            case this.states.REWARD:
                this.logicReward();
                break;
        }
    },


    /**
     * Вычисление выигрыша
     */
    calcReward: function() {
        this.payout = 0;

        if (this.rulesScoring && this.rulesScoring.length) {
            for (var i = 0, rl = this.rulesScoring.length; i < rl; i++) {
                if (Object.prototype.toString.call(this.rulesScoring[i]) === "[object Function]") {
                    this.payout += this.rulesScoring[i](this.result, this.bet);
                }
            }
        }

        this.displays.pays.draw(this.ctx, 0);

        if (this.payout > 0) {
            this._animateWinReelLightOffCounter = this.animateWinReelLightOffCount;

            try {
                this.soundWin.currentTime = 0;
                this.soundWin.play();
            }
            catch (err) { }
        }
    },


    onMouseMove: function(e) {
        this.ctx.mouse.x = e.offsetX;
        this.ctx.mouse.y = e.offsetY;
    },


    onClick: function(e) {
        var i, bl;

        // передаем событие кнопочкам
        if (this.buttons && this.buttons.length) {
            for (i = 0, bl = this.buttons.length; i < bl; i++) {
                if (this.buttons[i].hovered) {
                    this.buttons[i].handle(e, "click");
                }
            }
        }
    },


    handleKey: function(e) {
        if (e.keyCode == 32) { // spacebar
            e.preventDefault();
            if (this.gameState != this.states.REST) return;

            this.betMax();
        }
    },


    /**
     * Запускаем барабаны
     * @param bet
     */
    spin: function(bet) {
        this.bet = bet || this.bet;
        if (this.gameState != this.states.REST) return;
        if (this.credits < this.bet) return;

        this.credits -= this.bet;
        this.displays.pays.draw(this.ctx, '');

        this.startSlowing = [];
        this.result = [];
        this.gameState = this.states.BET;
    },


    /**
     * Ставим максимальную ставку и запускаем
     */
    betMax: function() {
        if (this.credits >= 3) this.spin(3);
        else if (this.credits == 2) this.spin(2);
        else if (this.credits == 1) this.spin(1);
    },


    /**
     * Прибавляем один к ставке если возможно
     */
    betOne: function() {
        if (this.gameState != this.states.REST) return;
        var newBet = this.bet + 1;

        if (newBet > this.credits || newBet > 3) {
            this.bet = 1;
        } else {
            this.bet++;
        }

        this.displays.bet.draw(this.ctx, this.bet);
    },


    start: function() {
        this.logic();
        this.render();
        requestAnimFrame( this.start.bind(this) );
    }
};


var slot = new Slot({}, document.getElementById("slots"));

slot.buttons.push(
    new Button("Bet one", 32, 340, 100, 60).on('click', function(e) {
        slot.betOne();
    })
);

slot.buttons.push(
    new Button("Bet max", 155, 340, 100, 60).on('click', function(e) {
        slot.betMax();
    })
);

slot.buttons.push(
    new Button("Spin reels", 398, 320, 120, 80).on('click', function(e) {
        slot.spin();
    })
);

