/*
    Slider Object 
    ref:https://jqueryui.com/slider/#default
    //目標1:當目標DOM寬度變大(與最初的設定相比),滑塊依據目標寬度比例跟者縮小
    //目標2:當滑塊左右移動時,目標DOM位置跟者左右移動
    //構想1:當目標DOM寬度變大時,滑塊跟者比例縮小
    //構想2:當滑塊位置變化時,傳出變化的範圍 ex:{ start: 0, end: 80 }  == +50 ==>  { start: 50, end: 130 }
*/
var Slider = function (obj) {
    /*
        variable
    */
    //最大値
    this.max;
    //最小值
    this.min;
    //當前値
    this.currentValue = 0;
    //最大値-最小値
    this.range = 0;
    //幕與bar條的單位比値
    this.ratio = 0;
    //幕的出書
    this.outputRange = { start: 0, end: 0 };
    //滑鼠起訖位置pageX
    this.x_start;
    this.x_end;
    //
    this.delegateFunctionPoint;
    /*
        DOM
    */
    //parent node
    //this.parentNode;// = obj.parentNode;
    //main node
    this.main = {
        node: undefined,
        style: {}
    };
    //slider
    this.slider = {
        node: undefined,
        style: {
            left: "0px"
        },
        width: 0
    };
    //slider bar
    this.sliderBar = {
        node: undefined,
        style: {},
        width: 0
    };

    /*
        operate function
    */
    //initial
    this.init = function () {
        //1. create element and append to document
        this._createSlider();
        //2. bind event
        this._bind_event_slider();
    };
    //create main DOM and sliderBar Dom and slider DOM
    this._createSlider = function () {
        var that = this;
        that.main.node = that.createElement("div", undefined, "Slider");

        that.slider.node = that.createElement("span", "slider");

        that.sliderBar.node = that.createElement("div", "sliderBar");

        //appendChild
        that.sliderBar.node.appendChild(that.slider.node);
        that.main.node.appendChild(that.sliderBar.node);

    };
    //bind mouse event to change position
    this._bind_event_slider = function () {
        var main = this,
            sliderFlag = false;
        main.slider.node.onmousedown = function (e) {
            sliderFlag = true;
            main.x_start = e.pageX;
            //console.log("滑鼠按下位置", main.x_start);
            this.style.opacity = "0.6";
        };
        main.sliderBar.node.onmousedown = function (e) {
            e.stopPropagation();
            
        };
        main.slider.node.onmousemove = function (e) {
            if (sliderFlag) {
                //operate out side function and carry slider move parameter
                //計算移動間距
                var range = main._calulate_mouseMove_Range(e.pageX, main.x_start);
                //移動必須介於範圍之間
                main.currentValue = +main.slider.style.left.split("px")[0] + range;
                if (main.currentValue < 0) {
                    main.currentValue = 0;
                }
                else if (main.currentValue > Math.ceil(main.range / main.ratio)) {
                    
                    main.currentValue = Math.ceil(main.range / main.ratio);
                    console.log("max range", main.currentValue);
                }
                //變更slider位置(只刷新DOM元素,未變更物件資料):暫時變更
                main.refresh_node_CssStyle(main.slider.node, { left: main.currentValue + "px" });

                //依據變化的值被委派執行外部進來的方法(此為一個外部的方法指標)
                if (!!main.delegateFunctionPoint) {
                    //console.log("slider X軸變化量:", main.currentValue);
                    main.delegateFunctionPoint(-(Math.floor(main.currentValue * main.ratio)), 0);//乘上來源的比例後位移畫布並刷新畫面
                }
            }
        };
        /*
        main.slider.node.onmouseleave = function (e) {
            if (sliderFlag) {
                //console.log("因超出slider元素範圍,所以代為執行mouseup事件");
                document.body.onmouseup(e);
            }
        };
        */
        document.body.onmouseup = function (e) {
            if (sliderFlag) {
                sliderFlag = false;
                console.log("mouse up", main.currentValue);
                e.target.style.opacity = "";
                //變更slider位置(刷新DOM元素,且變更物件資料):永久變更
                main._refresh_slider_CssStyle({ left: main.currentValue + "px" });
                //依據變化的值被委派執行外部進來的方法(此為一個外部的方法指標)
                //if (!!main.delegateFunctionPoint) {
                //    console.log("slider X軸變化量:", main.currentValue);
                //    main.delegateFunctionPoint(-main.currentValue, 0);//位移畫布並刷新畫面
                //}
            }
        };
    };
    //calculate mouse move range => scroll end x minus start x
    this._calulate_mouseMove_Range = function (x_end, x_start) {
        return document.body.scrollLeft + x_end - x_start;
    }
    //append a slider main node to parent node
    this.appendToNode = function (parent) {
        var that = this;
        if (parent instanceof HTMLElement) {
            //append to parent node
            parent.appendChild(that.main.node);
            //set min and init data
            //that._set_initial_data();
        }
        else {
            throw new Error("輸入參數非HTML元素");
        }
    };
    //設定初始會用到的數據
    this._set_initial_data = function () {
        var that = this;
        
        that.set_minValue(that.slider.node.offsetWidth);
        that.set_maxValue(that.sliderBar.node.clientWidth);
        console.log("init:", that.slider.node.offsetWidth, that.sliderBar.node.clientWidth);
    };
    //設定Slider的最大値
    this.set_maxValue = function (value) {
        var that = this,
            newSliderWidth = 0;
        if (isNaN(Number(value))) {
            console.log("parameter must be a number:" + value);
            return;
        }
        //若要設定的最大値小於物件的最小值則隱藏整個slider
        if (+value <= that.min) {
            that.refresh_node_CssStyle(that.main.node, { visibility: "hidden" });
        }
        else {
            that.refresh_node_CssStyle(that.main.node, { visibility: "visible" });
        }
        //update max value
        that.max = +value;
        console.log("SliderBar最大値:", that.max);
        //recalculate slider width
        newSliderWidth = that.scale(that.min, that.max, that.sliderBar.width);
        //設定比値
        that.ratio = +(that.max / that.sliderBar.width).toFixed(4);
        console.log("比値:", that.ratio);
        //設定最大最小的差値
        that.range = that.max - that.min;
        //
        that.slider.width = newSliderWidth;
        //refresh slider node style
        that.refresh_node_CssStyle(that.slider.node, { width: that.slider.width + "px" });
    };
    //設定Slider的最小値
    this.set_minValue = function (value) {
        var that = this;
        if (isNaN(Number(value))) {
            throw new Error("最小值設定錯誤:參數代有非數字" + value);
        }
        if (+value < 10) {
            value = 10;
        }
        that.min = Math.round(+value);
        that.sliderBar.width = that.min;//set slider bar width
        console.log("SliderBar最小値:", that.min);
    };
    //比例計算 x:y = a:b => a*y = x*b (x:原來尺寸;y:放大後的尺寸;a:需要依比例縮小的寬度;b:固定不變的寬度;)
    this.scale = function (x, y, b) {
        var a;
        a = ((x * b) / y).toFixed(2);//取到小數後兩位
        console.log("結果", a);
        return a;
    };
    //刷新slider物件的屬性數據與DOM inline Style
    this._refresh_slider_CssStyle = function (cssStyleObj) {
        var that = this;
        //刷新物件屬性數據
        that.set_Obj_style(that.slider.style, cssStyleObj);
        //刷新DOM inline style
        that.refresh_node_CssStyle(that.slider.node, cssStyleObj);
    };
    this.init();
};
/*
    Slider prototype (shared function and variable)
*/
Slider.prototype = {
    //覆蓋constructor指標
    constructor:Slider,
    min: 0, max: 0,currentValue:0,
    slider:{
        style: {

        }
    },
    sliderBar:{
        style: {
            //width: "100%",
            //height: "13px",

        }
    },
    //create DOM
    createElement: function (tagName, className, idName) {
        var element = document.createElement(tagName);
        if (!!className) {
            element.classList.add(className);
        }
        if (!!idName) {
            element.setAttribute("id", idName);
        }
        return element;
    },
    //change DOM class
    changeDomClass: function (element, oldClassName, newClassName) {
        element.classList.remove(oldClassName);
        element.classList.add(newClassName);
    },
    //將css style資料物件的值複製到物件的同名屬性
    set_Obj_style: function (myObj, CssStyleObj) {
        if ((CssStyleObj.constructor !== Object) || (myObj.constructor !== Object)) {
            throw new Error("parameter is not Object");
        }
        for (var property in CssStyleObj) {
            //若已設定過則跳過(不重覆設定)
            if (myObj[property] === CssStyleObj[property]) {
                continue;
            }
            myObj[property] = CssStyleObj[property];
        }
    },
    //依據輸入物件的屬性值來刷新DOM元素的Style屬性
    refresh_node_CssStyle: function (element, CssStyleObj) {
        //var cssText = "";
        for (var property in CssStyleObj) {
            if (element.style[property] === undefined) {
                console.log(property + "屬性不存在於style列表");
                continue;
            }
            //若已設定過則跳過(不重覆設定)
            if (element.style[property] === CssStyleObj[property]) {
                continue;
            }
            element.style[property] = CssStyleObj[property];
            //cssText += property + ": " + CssStyleObj[property] + ";";//串字串就不能檢查,因為style後的不允許"-" ex: background-color: xxx;
        }
        //element.style["cssText"] = cssText;//一次把重排+重繪做完
    }
};

