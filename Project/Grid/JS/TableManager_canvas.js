//目標功能
//1.建立table框架(即空殼DOM in memory)
//2.使用框架(DOM插入或替換DOM內的資料)
//var TableManager = {
//    'Version': '00'
//}
//
//**********************************************
/*
    Grid參考(台北資料開放平台預覽資料用的JS)
    slickgrid:https://github.com/mleibman/SlickGrid/blob/gh-pages/slick.grid.js
*/
//建立 table 框架 rows=>tr count, columns=>td count
var TableManager = function (obj) {
    this.data = [];                                 //原始資料的集合
    this.dataIndex = -1;
    this.refinedData = [];                          //重新定義的資料
    this.mainElement = obj.mainElement;             //指定注入的外部DOM父元素
    //紀錄寬度(含border,padding,不含scrollBar)
    this.width = obj.width || obj.mainElement.offsetWidth;
    //紀錄高度(含border,padding,不含scrollBar)
    this.height = obj.height || obj.mainElement.offsetHeight;
    //紀錄欄數
    this.column = obj.column || 5;
    this.row = obj.row || 20;
    //主Grid DOM元素
    this.gridElement;                               
    //資料展示元件
    this.refineNodeTable = [];                      
    //縮放元件主Node
    this.ResizeBarRootNode;                          
    //縮放元件
    this.ResizeBarNodeList = [];                     
    //縮放元件寬度
    this.ResizeBarCount = this.column;               
    //紀錄每次滑鼠移動時的間距差
    this.ResizeBar_X_rangeList = [];                 
    //mousedown start position
    this.X_start;                                   
    //mousemove end position
    this.X_end;                                     
    //Grid欄位的平均寬度
    this.columnWidth;                               
    //Grid列的平均高度
    this.rowHeight;                                 
    //flexi bar元件的寬度値
    this.ResizeBarWidth = 10;
    //page control root node
    this.pageControlRootNode = { incrementPageRoot: undefined, specifiedPageRoot: undefined };
    //page control array
    this.pageControl = { incrementPageList: [], specifiedPageList: [] };
    //current click page
    this.currentPage = 0;
    //Grid額外的寬度
    this.GridExtraWidth = 50;
    //欄位的排列順序
    this.columnSequence = [];
    //sort root node
    this.columnSortedRootNode;
    //sort
    this.columnSortNodeList = [];
    //排序過的數據
    this.sortedObject = {};
    //主DOM下的DOM容器
    this.mainContainer;
    //Slider Object
    this.slider;
    //初始化
    this.init = function () {
        //1.建立展示資料元素
        this.createDisplayNode();
        //2.重新定義元素結構
        this.redefineGridNodesStruct();
        //2-1.設定欄位順序陣列
        this.set_columnSequenceArray();
        //3.設定主grid元素外框CSS style
        //this.set_gridRootNodeStyle();
        //4.刷新Grid的所有元素style
        //this.refresh_allDisplayElementCssStyle();
        this.refresh_allDisplayElement_canvas();
        //5.建立flexi bar
        this.createResizeBar();
        //6.refresh flexi bar css style 
        this.refresh_ResizeBarCssStyle();
        //7.flexi bar bind mouse evnt and calculate X range(Closure)
        this.bind_event_ResizeBar();
        //8.建立(遞增或遞減)切頁元件
        this.createIncrementPageControl();
        //9.設定(遞增或遞減)切頁元件CSS Style
        this.set_incrementPageControl_CSS();
        //10.(遞增或遞減)切頁事件綁定
        this.bind_event_incrementPageControl();
        //11.建立(指定頁)切頁元件(1~10個)
        this.createSpecifiedPageControl();
        //12.刷新(指定頁)切頁元件CSS與値
        this.set_specifiedPageControl_CSS();
        //13.綁定(指定頁)切頁事件
        this.bind_event_specifiedPageControl();

        //11.欄位拖曳資料交換事件綁定--作欄與欄資料交換
        //this.event_bind_header();
        //12.建立欄位排序元件
        this.createSortNodeList();
        //13.設定欄位排序元件CSS
        this.set_columnSortNode_CSS();
        //14.欄位排序元素click事件綁定
        this.bind_event_columnSortNode();
        //15.建立Slider物件
        this.createSlider();
    };
    /*
        資料表格元件
    */
    //1.建立展示資料元素
    this.createDisplayNode = function () {
        
        //建立展示資料元素
        this.gridElement = this.new.createElement("canvas", 'canvas');
        ////console.log('dom:', this.gridElement);
        this.gridElement.setAttribute("width", this.width);
        this.gridElement.setAttribute("height", this.height);
        this.mainElement.appendChild(this.gridElement);
    };
    //2.設定自定義的node結構
    this.redefineGridNodesStruct = function () {
        var main = this,
            container = [],
            innerContainer = [],
            allChilds,
            length = (this.gridElement.children.length > 0) ? (allChilds = this.gridElement.children,this.gridElement.children.length) : this.column * this.row;
            
        //set every column width and height(設定欄位平均寬度和厚度)
        main.columnWidth = (main.width / main.column);
        main.rowHeight = (main.height / main.row);

        for (var elementIndex = 0; elementIndex < length; elementIndex++) {
            var rowIndex = (elementIndex % main.row),
                columnIndex = Math.floor(elementIndex / this.row),
                isHeader = (elementIndex % main.row == 0),
                //defined data content(自訂的資料物件)
                data = {
                    row: rowIndex,//column導向                    //Math.floor(elementIndex / this.column),  //row導向
                    column: columnIndex,  //column導向            //(elementIndex % this.column),//列導向
                    default_Width: main.columnWidth,              //預設寬度:平均值
                    default_Left: (columnIndex * main.columnWidth),//預設X軸位置:固定寬度的間距
                    nodeCSS: {                                    //CSS Style 
                        position: "absolute",
                        width: (main.columnWidth) + "px",
                        height: (main.rowHeight) + "px",
                        top: (rowIndex * main.rowHeight) + "px",//因以欄位為基準,所以剛好相反
                        left: (columnIndex * main.columnWidth) + "px",
                        border: "2px solid white",
                        textAlign:"center",
                        backgroundColor: isHeader ? "rgb(120, 207, 207)" : "rgb(174, 233, 233)",
                        overflow: "hidden"
                    },
                    node: new pseudoDOM(columnIndex + "-" + rowIndex, (columnIndex * main.columnWidth), (rowIndex * main.rowHeight), (main.columnWidth), (main.rowHeight)),//allChilds[elementIndex],
                    nodeAttributes: isHeader ? {
                        draggable: true
                    } : {},
                    value: "",
                    type: isHeader ? "header" : "body"////column導向       //(Math.floor(elementIndex / this.column) == 0) ? "header" : "body"//row導向
                };
            
            //[[{}]] => column( row( data Object ) )
            //若不存在建立新的陣列容器
            if (!container[data.column]) {
                container.push([]);
            }
            //直接指定
            container[data.column][data.row] = data;
        }
        //console.log('refine result',container);
        //結果輸出
        this.refineNodeTable = container;
    };
    //2-1.設定欄位順序陣列
    this.set_columnSequenceArray = function () {
        var main = this;
        main.refineNodeTable.forEach(function (current, index) {
            main.columnSequence.push(index);
        });

    };
    //3.設定主grid元素外框CSS style
    this.set_gridRootNodeStyle = function () {
        var main = this;
        main.gridElement.style.position = "relative";
        //main.gridElement.style.border = "1px solid red";
        main.gridElement.style.width = main.width + main.GridExtraWidth + "px";//加上擴展的寬度(使最右邊的flexi bar可以向右拖曳不卡住)
        main.gridElement.style.height = main.height + 10 + "px";
        main.gridElement.style.overflowY = "hidden";
        main.gridElement.style.overflowX = "visable";//
    };
    //4.刷新Grid內所有display元素的CSS Style屬性或指定的CSS屬性
    this.refresh_allDisplayElementCssStyle = function (mainObj, columnIndex, propertyName) {
        var main = mainObj || this;
        //object css set into element css style 刷新所有展
        for (var column_Index = columnIndex || 0; column_Index < main.column; column_Index++) {
            for (var rowIndex = 0; rowIndex < main.row; rowIndex++) {
                //若無指定CSS屬性名稱
                if (!propertyName) {
                    //全部刷新
                    for (var property in main.refineNodeTable[column_Index][rowIndex].nodeCSS) {
                        main.refineNodeTable[column_Index][rowIndex].node.style[property] = main.refineNodeTable[column_Index][rowIndex].nodeCSS[property];
                    }
                    //若為header 設定可拖曳屬性
                    if (main.refineNodeTable[column_Index][rowIndex].type === "header") {
                       
                        main.refineNodeTable[column_Index][rowIndex].node.setAttribute(attribute, main.refineNodeTable[column_Index][rowIndex].nodeAttributes[attribute]);
                        
                    }
                }
                else {
                    //指定刷新
                    main.refineNodeTable[column_Index][rowIndex].node.style[propertyName] = main.refineNodeTable[column_Index][rowIndex].nodeCSS[propertyName];
                }
            }
        }
    };
    this.refresh_allDisplayElement_canvas = function (mainObj, columnIndex, propertyName) {
        var main = mainObj || this,
            ctx = main.gridElement.getContext("2d"),
            tempObj;
        //object css set into element css style 刷新所有展
        for (var column_Index = columnIndex || 0; column_Index < main.column; column_Index++) {
            for (var rowIndex = 0; rowIndex < main.row; rowIndex++) {
                //若無指定CSS屬性名稱
                if (!propertyName) {
                    tempObj = main.refineNodeTable[column_Index][rowIndex];
                    tempObj.node.style["backgroundColor"] = tempObj.nodeCSS["backgroundColor"];
                    //tempObj.node.refresh_textContent(ctx);
                    tempObj.node.translate_and_refresh_textContent(ctx);
                    /*
                    //全部刷新
                    for (var property in main.refineNodeTable[column_Index][rowIndex].nodeCSS) {
                        main.refineNodeTable[column_Index][rowIndex].node.style[property] = main.refineNodeTable[column_Index][rowIndex].nodeCSS[property];
                    }
                    //若為header 設定可拖曳屬性
                    if (main.refineNodeTable[column_Index][rowIndex].type === "header") {
                        for (var attribute in main.refineNodeTable[column_Index][rowIndex].nodeAttributes) {
                            main.refineNodeTable[column_Index][rowIndex].node.setAttribute(attribute, main.refineNodeTable[column_Index][rowIndex].nodeAttributes[attribute]);
                        }
                    }
                    */
                }
                else {
                    //指定刷新
                    main.refineNodeTable[column_Index][rowIndex].node.style[propertyName] = main.refineNodeTable[column_Index][rowIndex].nodeCSS[propertyName];
                }
            }
        }
    };
    /*
        欄位縮放元件
    */
    //5.create flexi bar and initial property (flexi bar:控制Grid上每個欄位的寬度與位置)
    this.createResizeBar = function () {
        var main = this,
            tmpNodes;
        //建立 flexi bar 元素
        main.ResizeBarRootNode = main.new.create('div', main.ResizeBarCount, 'ResizeBar');
        //casting to array
        tmpNodes = Array.prototype.slice.call(main.ResizeBarRootNode.children);//轉成陣列元素
        
        //set property into main object //iterator
        tmpNodes.forEach(function (currentElement, index, array) {
            var default_left = ((main.columnWidth * (index + 1)));// - main.ResizeBarWidth),//每個flexi bar的預設 X axis 位置
                //建立縮放元素(flexi bar)的資料結構
                data = {
                    index: index,               //第幾條
                    default_left: default_left, //初始位置
                    X_deviation: 0,//滑鼠事件的移動變化值(原始值的遞增或遞減)
                    forward_width: default_left - ((!!main.ResizeBarNodeList[index - 1]) ? main.ResizeBarNodeList[index - 1].default_left : 0),//與前一個元素的間距寬度
                    node: currentElement,       //DOM元素
                    nodeCSS: {                  //設定用CSS
                        position: "absolute",
                        //border: "1px solid yellow", //只是用來看元件位置
                        backgroundColor: "",
                        width: main.ResizeBarWidth + "px",
                        height: main.height + "px",
                        left: default_left + "px",
                        top: "0px"
                    },
                    type: "ResizeBar"            //物件種類
                };
            ////console.log(currentElement);
            main.ResizeBarNodeList.push(data);//加入主物件
        });
        ////console.log('init flexi bar', main.ResizeBarNodeList.map(function (current, index, array) { return current.forward_width; }))
        //輸出到main元素上
        main.mainElement.appendChild(main.ResizeBarRootNode);
    };
    //6.refresh flexi bar css style 
    this.refresh_ResizeBarCssStyle = function (mainObj, columnIndex, propertyName) {
        var main = mainObj || this;
        //flexiNodes = main.ResizeBarRootNode.children;
        //設定所有縮放元素,若有指定起始index則取指定値當起始値
        for (var index = columnIndex || 0; index < main.ResizeBarNodeList.length; index++) {
            //若有指定設定名稱
            if (!!propertyName) {
                main.ResizeBarNodeList[index].node.style[propertyName] = main.ResizeBarNodeList[index].nodeCSS[propertyName];
            }
            else {
                //設定所有Css Style
                for (var property in main.ResizeBarNodeList[index].nodeCSS) {
                    main.ResizeBarNodeList[index].node.style[property] = main.ResizeBarNodeList[index].nodeCSS[property];
                }
            }
        }
    };
    //7.flexi bar bind mouse evnt and calculate X range(Closure)
    this.bind_event_ResizeBar = function () {
        var main = this,
            moveFlag = false,
            ResizeBarIndex = 0;//紀錄當前觸發flexi bar 的索引值,當作column index
        //對所有的flexi bar 設定mousedown事件綁定//currentElement為自訂義物件
        main.ResizeBarNodeList.forEach(function (currentElement, index, array) {
            ////console.log("CurrentElement", currentElement);
            
            currentElement.node.addEventListener("mousedown", function (e) {
                e.stopPropagation();//事件不再上升
                e.preventDefault();//停用DOM的drag功能,避免拖曳DOM
                //ref:http://stackoverflow.com/questions/69430/is-there-a-way-to-make-text-unselectable-on-an-html-page
                //console.log("Down", e.target.className, index);
                ResizeBarIndex = index;
                moveFlag = true;
                main.X_start = document.body.scrollLeft + main.gridElement.scrollLeft + e.pageX;
                //console.log("Down:pageX ", main.X_start);
            }, false);
        });
        //對Grid Root 元素作mousemove事件綁定 -- 用來計算移動間距與展示移動間距
        main.gridElement.addEventListener("mousemove", function (e) {
        //document.addEventListener("mousemove", function (e) {
            if (moveFlag) {
                main.X_end = e.pageX;//X axis end position
                ////console.log("srcollLeft", document.body.scrollLeft, "main.X_end", main.X_end, "main.X_start", main.X_start);
                var x_range = (document.body.scrollLeft + main.gridElement.scrollLeft + main.X_end - main.X_start);//  - (main.slider.currentValue * main.slider.ratio));//取得間距
                //設定最小間距
                if (main.ResizeBarNodeList[ResizeBarIndex].forward_width + x_range < 30) {
                    x_range = 30 - main.ResizeBarNodeList[ResizeBarIndex].forward_width;
                }
                //取得移動間距差(設定目前指定索引的間距)
                main.ResizeBar_X_rangeList[ResizeBarIndex] = x_range;//(document.body.scrollLeft + main.gridElement.scrollLeft + main.X_end - main.X_start);//取得間距
                ////console.log("Range", main.ResizeBar_X_rangeList[ResizeBarIndex], "Index", ResizeBarIndex);

                //更新flexi bar並累計最後的X軸偏移量
                main._update_nodeCSS_CssStyle(main, ResizeBarIndex, main.ResizeBar_X_rangeList[ResizeBarIndex], 'left');
            }
        });
        //mouse up event (設定最終的X axis偏移量)
        document.addEventListener("mouseup", function (e) {
            if (moveFlag) {
                moveFlag = false;//關閉mousemove
                //設定最終的X axis偏移量(ResizeBarNodeList陣列內所有的X_deviation)
                main._update_ResizeBar_last_Xdeviation(main, ResizeBarIndex, main.ResizeBar_X_rangeList[ResizeBarIndex]);
                //只看X偏移量,所以其它屬性濾掉了
                //console.log("Up:X軸變化量", main.ResizeBarNodeList.map(function (current, index, array) { return current.X_deviation; }));
                //只看寬度變化量
                //console.log("Up:寬度變化量", main.ResizeBarNodeList.map(function (current, index, array) { return current.forward_width; }));

                /***************************************/
                //取最後一根縮放桿位置當寬度(延伸畫布)
                var lastResizeBar = main.ResizeBarNodeList[main.ResizeBarNodeList.length - 1];
                var totalWidth = lastResizeBar.default_left + lastResizeBar.X_deviation;
                //重算slider寬度
                main.slider.set_maxValue(totalWidth);

            }
        });
    };
    //7-1.更新指定與其相關的dispaly物件和flexi bar物件的width值與left值(update specified column width and others left, update specified flexi bar width and others left )
    this._update_nodeCSS_CssStyle = function ( mainObj, columnIndex, x_range, propertyName) {
        var ctx = mainObj.gridElement.getContext("2d");//取得canvas的context
        var lastResizBar_Left = 0;//最後一根ResizeBar的位置
        for (var index = columnIndex ; index < mainObj.ResizeBarNodeList.length; index++) {
            /**********************************************************/
            //(指定的拖曳軸)預設left + 上次變化量 + 本次變化量 => (指定拖曳軸)本次所需移動的left位置
            var resizeBar_Left = (mainObj.ResizeBarNodeList[index].default_left + mainObj.ResizeBarNodeList[index].X_deviation + x_range - (mainObj.slider.currentValue * mainObj.slider.ratio));//要減掉slider拖移時產生的位移差
            /**********************************************************/
            /*
                更新Resize bar條
            */
            //更新flexi bar的nodeCSS內指定的屬性值
            mainObj.ResizeBarNodeList[index].nodeCSS[propertyName] = resizeBar_Left + "px";
            //更新flexi bar元素的指定CSS style
            mainObj.ResizeBarNodeList[index].node.style[propertyName] = mainObj.ResizeBarNodeList[index].nodeCSS[propertyName];
            //超出Grid範圍就隱藏DOM
            if (resizeBar_Left - 15 > mainObj.width || resizeBar_Left < 0) {
                mainObj.ResizeBarNodeList[index].nodeCSS["visibility"] = "hidden";
                mainObj.ResizeBarNodeList[index].node.style["visibility"] = mainObj.ResizeBarNodeList[index].nodeCSS["visibility"];
            }
            else {
                mainObj.ResizeBarNodeList[index].nodeCSS["visibility"] = "visible";
                mainObj.ResizeBarNodeList[index].node.style["visibility"] = mainObj.ResizeBarNodeList[index].nodeCSS["visibility"];
            }
            //debugger;
            /**********************************************************/
            /*
                更新Grid元件
            */
            //若為拖曳元素的索引値
            if (index === columnIndex) {
                //變更目前寬度
                mainObj.refineNodeTable[index].forEach(function (currentElement, innerIndex, array) {
                    //更新display元素的nodeCSS內指定的屬性值
                    currentElement.nodeCSS['width'] = (mainObj.ResizeBarNodeList[index].forward_width + x_range) + "px";//前一次的寬度値 + 變化量
                    //更新canvas的
                    currentElement.node.style.width = +currentElement.nodeCSS['width'].split("px")[0];//cast to number
                    //currentElement.node.refresh_textContent(ctx);
                    currentElement.node.translate_and_refresh_textContent(ctx);
                });
            }
            else {
                //為拖曳元素後面所有的元素(left位置重新定位)
                mainObj.refineNodeTable[index].forEach(function (currentElement, innerIndex, array) {
                    //前一個元素的預設值位置 + 之前累積的變化量 + 這次的變化量
                    currentElement.nodeCSS[propertyName] = (mainObj.ResizeBarNodeList[index - 1].default_left + mainObj.ResizeBarNodeList[index-1].X_deviation + x_range) + 'px';//
                    currentElement.node.style.left = +currentElement.nodeCSS[propertyName].split("px")[0];
                    //currentElement.node.refresh_textContent(ctx);
                    currentElement.node.translate_and_refresh_textContent(ctx);
                });
            }
            /**********************************************************/
            /*
                更新排序元件位置
            */
            mainObj.columnSortNodeList[index].nodeCSS[propertyName] = resizeBar_Left - 15 + "px";
            mainObj.columnSortNodeList[index].node.style[propertyName] = mainObj.columnSortNodeList[index].nodeCSS[propertyName];
            //超出Grid範圍就隱藏DOM
            if (resizeBar_Left - 15 > mainObj.width) {
                mainObj.columnSortNodeList[index].nodeCSS["visibility"] = "hidden";
                mainObj.columnSortNodeList[index].node.style["visibility"] = mainObj.columnSortNodeList[index].nodeCSS["visibility"];
            }
            else {
                mainObj.columnSortNodeList[index].nodeCSS["visibility"] = "visible";
                mainObj.columnSortNodeList[index].node.style["visibility"] = mainObj.columnSortNodeList[index].nodeCSS["visibility"];
            }
        }
        /*
            (若縮到小於原始canvas寬度)清除最後一塊矩陣
        */
        lastResizBar_Left = +mainObj.ResizeBarNodeList[mainObj.ResizeBarNodeList.length - 1].nodeCSS.left.split("px")[0];
        ////console.log("last left", lastResizBar_Left);
        //若所有欄位累計寬度比原來的預設小,就清除後面的多餘矩形
        if (lastResizBar_Left < mainObj.gridElement.width) {
            ctx.clearRect(lastResizBar_Left, 0, mainObj.gridElement.width - lastResizBar_Left, mainObj.gridElement.height);
        }
        ////console.log('Move refinedNodeList', mainObj.refineNodeTable);
    };
    //7-2.依據指定索引更新當前flexi bar與下一個flexi bar的間距値(即寬度)並累加指定索引後面的X軸變化量(依據指定的索引變更並累計ResizeBarNodeList陣列內所有的X_deviation)
    this._update_ResizeBar_last_Xdeviation = function (mainObj, columnIndex, x_range) {
        for (var index = columnIndex ; index < mainObj.ResizeBarNodeList.length; index++) {
            mainObj.ResizeBarNodeList[index].X_deviation += x_range;//累加X axis 變化量
        }
        mainObj.ResizeBarNodeList[columnIndex].forward_width += x_range;//依據指定索引更新寬度變化量
    };
    /*
        切頁元件
    */
    //8.建立(遞增或遞減)切頁元件(只有7個control:首頁,遞增1或10頁,遞減1或10頁,末頁)
    this.createIncrementPageControl = function () {
        var main = this,
            tmpNodes,
            textValue = ['min', '-10', '-1', 'Status', '+1', '+10', 'max'];
        //建立(遞增或遞減)切頁控制元件
        main.pageControlRootNode.incrementPageRoot = main.new.create('div', 7, 'multiple_page_control');
        //Control DOM Collection cast to Array 
        tmpNodes = Array.prototype.slice.call(main.pageControlRootNode.incrementPageRoot.children);//
        ////console.log('Control Node', tmpNodes);
        /*********************************************************/
        //initial control property
        tmpNodes.forEach(function (current, index, array) {
            //依據textValue陣列資料値選擇並取得切頁資料物件
            var data = main._get_incrementPageControl_Object(current, index, textValue[index]);
            main.pageControl.incrementPageList.push(data);
        });
        //console.log('page Control', main.pageControl.incrementPageList);
        main.mainElement.appendChild(main.pageControlRootNode.incrementPageRoot);
    };
    //(私)取得(遞增或遞減)切頁資料物件
    this._get_incrementPageControl_Object = function (node, index, category) {
        var main = this,
            data = {
                index: index,
                node: node,
                nodeCSS: {
                    "position": "absolute",
                    "background-color": "#e8f3f3",
                    "border": "1px solid white",
                    //"border-radius": "10px",
                    "width": "50px",
                    "height": "50px",
                    "top": (main.height + 12) + "px",
                    "text-align": "center",
                    //padding:"20px",
                    "line-height": "50px",  //textContent下移
                    "visibility": "visible"
                },
                value: "",//category,
                category: category,
                type: "page_control"
            };
        switch (category) {
            case "Status":
                data.nodeCSS["width"] = (main.width * 10 / 16) + 'px';//"100px";
                data.nodeCSS["left"] = (+main.pageControl.incrementPageList[index - 1].nodeCSS['width'].split('px')[0] + +main.pageControl.incrementPageList[index - 1].nodeCSS['left'].split('px')[0]) + "px";
                data.nodeCSS["visibility"] = "hidden";//隱藏起來(暫時不用)
                break;
            case "-10":
                data.node.classList.add('double_arrow_left');
                data.nodeCSS["width"] = (main.width / 16) + 'px';//分成16等份來切區塊//"50px";
                data.nodeCSS["left"] = (+main.pageControl.incrementPageList[index - 1].nodeCSS['width'].split('px')[0] + +main.pageControl.incrementPageList[index - 1].nodeCSS['left'].split('px')[0]) + "px";
                break;
            case "-1":
                data.node.classList.add('arrow_left');
                data.nodeCSS["width"] = (main.width / 16) + 'px';//分成16等份來切區塊//"50px";
                data.nodeCSS["left"] = (+main.pageControl.incrementPageList[index - 1].nodeCSS['width'].split('px')[0] + +main.pageControl.incrementPageList[index - 1].nodeCSS['left'].split('px')[0]) + "px";
                break;
            case "+1":
                data.node.classList.add('arrow_right');
                data.nodeCSS["width"] = (main.width / 16) + 'px';//分成16等份來切區塊//"50px";
                data.nodeCSS["left"] = (+main.pageControl.incrementPageList[index - 1].nodeCSS['width'].split('px')[0] + +main.pageControl.incrementPageList[index - 1].nodeCSS['left'].split('px')[0]) + "px";
                break;
            case "+10":
                data.node.classList.add('double_arrow_right');
                data.nodeCSS["width"] = (main.width / 16) + 'px';//分成16等份來切區塊//"50px";
                data.nodeCSS["left"] = (+main.pageControl.incrementPageList[index - 1].nodeCSS['width'].split('px')[0] + +main.pageControl.incrementPageList[index - 1].nodeCSS['left'].split('px')[0]) + "px";
                break;
            case "max":
                data.node.classList.add('right_end');
                data.nodeCSS["width"] = (main.width / 16) + 'px' ;//分成16等份來切區塊//"50px";
                data.nodeCSS["left"] = (+main.pageControl.incrementPageList[index - 1].nodeCSS['width'].split('px')[0] + +main.pageControl.incrementPageList[index - 1].nodeCSS['left'].split('px')[0]) + "px";
                break;
            case "min":
                data.node.classList.add('left_end');
                data.nodeCSS["width"] = "50px";
                data.nodeCSS["left"] = "0px";
                break;
            default:
                throw new Error("Page Control Category not defined");
        }
        return data;
    };
    //9.刷新(遞增或遞減)切頁元件CSS與値
    this.set_incrementPageControl_CSS = function () {
        var main = this;
        for (var index = 0; index < main.pageControl.incrementPageList.length; index++) {
            var cssText = "";
            for (var propertyName in main.pageControl.incrementPageList[index].nodeCSS) {
                cssText += propertyName + ":" + main.pageControl.incrementPageList[index].nodeCSS[propertyName] + "; ";
            }
            main.pageControl.incrementPageList[index].node.style.cssText = cssText;
            main.pageControl.incrementPageList[index].node.textContent = main.pageControl.incrementPageList[index].value;
        }
    };
    //10.綁定(遞增或遞減)切頁事件
    this.bind_event_incrementPageControl = function () {
        var main = this;
            
        main.pageControl.incrementPageList.forEach(function (current, index, array) {
            switch (current.category) {
                case "min":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        //
                        main.refresh_specifiedPageControl_pageIndex(1);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        //console.log('切頁:min');
                    };
                    break;
                case "-10":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage - 10) >= 1) ? (main.currentPage - 10) : 1;
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        //console.log('切頁: -10');
                    };
                    break;
                case "-1":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage - 1) >= 1) ? (main.currentPage - 1) : 1;
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        //console.log('切頁: -1');
                    };
                    break;
                case "+1":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage + 1) <= (main.refinedData.length - 1)) ? (main.currentPage + 1) : (main.refinedData.length - 1);
                        //console.log('+1', currentPage);
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        //console.log('切頁: +1');
                    };
                    break;
                case "+10":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage + 10) <= (main.refinedData.length - 1)) ? (main.currentPage + 10) : (main.refinedData.length - 1);
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        //console.log('切頁: +10');
                    };
                    break;
                case "max":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = (main.refinedData.length - 1);
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        //console.log('切頁:max');
                    };
                    break;
            }

        });
    };
    //11.建立(指定頁)切頁元件(1~10頁)
    this.createSpecifiedPageControl = function () {
        var main = this,
            tmpNodes;
        //建立(指定頁)控制元件
        main.pageControlRootNode.specifiedPageRoot = main.new.create('div', 10, 'page_control');
        //Control DOM Collection cast to Array 
        tmpNodes = Array.prototype.slice.call(main.pageControlRootNode.specifiedPageRoot.children);//
        ////console.log('Control Node', tmpNodes);
        //initial control property
        tmpNodes.forEach(function (current, index, array) {

            var data = {
                //物件索引
                index: index,
                //DOM元素
                node: current,
                //DOM對應的style設定
                nodeCSS: {
                    "position": "absolute",
                    "background-color": "#e8f3f3",
                    "border": "1px solid white",
                    //border-radius": "10px",
                    "width": (main.width / 16) + 'px',
                    "height": "50px",
                    "left": +main.pageControl.incrementPageList[2].nodeCSS.left.split('px')[0] + (main.width / 16 * (index + 1)) + "px",
                    "top": main.height + 12 + "px",
                    "text-align": "center",
                    //padding:"20px",
                    "line-height": "50px",  //下移
                    "visibility": "visible"
                },
                //選擇flag
                selected: false,
                //頁數
                pageIndex: (index + 1),//初始的預設値: 1 ~ 10
                //物件格式
                type: "page_control",
                //set selected flag func
                set_select: function (flag) {
                    this.selected = flag, this._change_backgroundColorStyle(this.selected);//依據flag變更css style
                },
                get_select: function () {
                    return this.selected;
                },
                //設定指定頁物件的pageIndex屬性
                set_pageIndex: function (pageIndex) {
                    //檢查是否為數字
                    var page = isNaN(Number(pageIndex)) ? undefined : pageIndex;
                    this.pageIndex = page;
                    this.node.textContent = this.pageIndex;
                    //依據pageIndex屬性設定:若非數字則隱藏DOM元素
                    this._change_visibility(this.pageIndex);
                },
                //取得指定頁物件的pageIndex屬性
                get_pageIndex:function(){
                    return this.pageIndex;
                },
                //(private)chagne self css style
                _change_backgroundColorStyle: function (flag) {
                    this.nodeCSS['backgroundColor'] = !!flag ? "#3399FF" : "rgb(232, 243, 243)";
                    this.node.style['backgroundColor'] = this.nodeCSS['backgroundColor'];
                },
                //(private)change DOM visibility style when visible is true or hidden
                _change_visibility: function (visible) {
                    this.node.style['visibility'] = !!visible ? "visible" : "hidden";
                }
            };
            main.pageControl.specifiedPageList.push(data);//物件注入指定頁屬性(陣列)
        });
        ////console.log('page Control[specifiedPageList]:', main.pageControl.specifiedPageList);
        main.mainElement.appendChild(main.pageControlRootNode.specifiedPageRoot);//附加到主DOM上
    };
    //12.刷新(指定頁)切頁元件CSS與値
    this.set_specifiedPageControl_CSS = function () {
        var main = this;
        for (var index = 0; index < main.pageControl.specifiedPageList.length; index++) {
            var cssText = "";
            for (var propertyName in main.pageControl.specifiedPageList[index].nodeCSS) {
                cssText += propertyName + ":" + main.pageControl.specifiedPageList[index].nodeCSS[propertyName] + "; ";
            }
            main.pageControl.specifiedPageList[index].node.style.cssText = cssText;
            main.pageControl.specifiedPageList[index].node.textContent = main.pageControl.specifiedPageList[index].pageIndex;
        }
    };
    //刷新指定頁的pageIndex屬性
    this.refresh_specifiedPageControl_pageIndex = function (pageIndex) {
        var main = this,
            maxPage = (main.refinedData.length - 1),    //取得自定資料物件的最大頁數値
            last_digit_ten = Math.floor((main.currentPage - 1) / 10),
            digit_ten = Math.floor((pageIndex -1) / 10);     //取得頁的非個位數的値(ex: 第10頁 => 0,第11頁 => 1)
        if (pageIndex < 0 || pageIndex > (main.refinedData.length - 1)) {
            throw new Error("[_refresh_specifiedPageControl_pageIndex] Error: PageIndex:" + pageIndex + " out of range");
        };
        //前一次的頁範圍與當前頁範圍不同才刷新指定頁物件
        if (last_digit_ten !== digit_ten) {
            //刷新指定頁物件的所有pageIndex屬性與DOM內容
            main.pageControl.specifiedPageList.forEach(function (current, index, array) {
                var pageIndex = (digit_ten * 10) + index + 1;//當前要設定的頁索引値,若超過自定資料物件的最大頁數則設為空
                if (pageIndex <= maxPage) {
                    current.set_pageIndex(pageIndex);
                }
                else {
                    current.set_pageIndex("");
                }
            });
        }
        //取消前一次指定頁的select屬性與背景色
        main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(false);
        //設定當前頁
        main.currentPage = pageIndex;
        //設定當前指定頁的slect屬性與背景色
        main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(true);
        //刷新顯示資料
        main.display_data_canvas(main.currentPage);
    };
    //13.綁定(指定頁)切頁事件
    this.bind_event_specifiedPageControl = function () {
        var main = this,
            currentIndex = 0,
            tmpCurrentPageIndex = 0;
        main.pageControl.specifiedPageList.forEach(function (current,index,array) {
            current.node.onclick = function (e) {
                //取消上次指定頁物件的select屬性並還原背景色
                main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(false);
                
                //設定觸發click事件的物件索引
                currentIndex = index;
                tmpCurrentPageIndex = current.pageIndex;//取得物件內page屬性的值
                //console.log("page click: " + currentIndex, 'Control object PageIndex:',current.pageIndex);
                main.currentPage = tmpCurrentPageIndex;//變更主物件的當前頁屬性値
                main.display_data_canvas(main.currentPage);//依據頁値刷新顯示資料
                main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(true);//變更本次指定頁物件的select屬性並變更背景色
            }
        });
    };
    /*
        數據注入公用方法
    */
    //json data load and refine data for table format
    this.JsonDataLoad = function (JsonData, refinedFunc) {
        var data;
        if (!!JsonData) {
            data = (!!refinedFunc) ? refinedFunc(JsonData) : JsonData;//if has refine function then call it or just origin JSON
            this.data.push(data);
            this.dataIndex += 1;//目前所使用的厡始資料索引
            this.refine_JsonData(data);//將注入資料轉換成自訂格式物件(即refinedData[頁][欄][列])
            this.currentPage = 1;//定義當前頁屬性為第1頁
            this.display_data_canvas(this.currentPage);//使用自定格式物件刷新頁面
            this.pageControl.specifiedPageList[this.currentPage - 1].set_select(true);//變更指定頁物件的select屬性並變更背景
            this._refresh_columnSortName();//
            //頁狀態物件的元素屬性(node => DOM)
            this.pageControl.incrementPageList[3].node.textContent = this.currentPage + "/" + (this.refinedData.length - 1);
        }
    };
    /*
        數據元件
    */
    //重新定義輸入的數據轉成自訂格式 => [頁][欄][列] => 數據
    this.refine_JsonData = function (jsonData) {
        if (jsonData instanceof Array) {

            var everyRowCount = this.row - 1;//every page include header in row 0 so minus 1
            var currentPage,
                columnIndex,
                currentRowIndex,
                refinedData = this.refinedData = [];//給個指標,否則下面的func會指回Winodw

            jsonData.forEach(function (currentObj, index, array) {
                currentPage = Math.floor(index / everyRowCount) + 1;//page start is 1 [page 0 is undefined]
                columnIndex = 0;
                currentRowIndex = index % everyRowCount;//當前的列索引 = 當前索引除以列總數的餘數
                //從json物件列舉所有資料並做設定
                for (var propertyName in currentObj) {
                    //若為每一頁的第一個資料物件
                    if (currentRowIndex === 0) {
                        refinedData[currentPage] = refinedData[currentPage] || [];//若沒設定過給column設定一個陣列,若有設定過則用當前的
                        var rowArray = [propertyName];//插入一個新的row陣列
                        refinedData[currentPage].push(rowArray);//將每個column都插上一個新row
                        ////console.log(refinedData[currentPage][columnIndex]);
                    }
                    refinedData[currentPage][columnIndex].push(currentObj[propertyName]);
                    columnIndex++;
                }
            });
            ////console.log('refined array', this.refinedData);//[page][column][row] => page:[column:[row:[]]]
        }
    };
    //數據寫入顯示元素
    this.display_data = function (pageIndex) {
        var main = this;
        for (var columnIndex = 0; columnIndex < main.refineNodeTable.length; columnIndex++) {
            for (var rowIndex = 0; rowIndex < main.refineNodeTable[columnIndex].length; rowIndex++) {
                ////console.log("順序", main.columnSequence[columnIndex], main.refinedData[pageIndex][main.columnSequence[columnIndex]][rowIndex]);
                //欄位資料依據欄位陣列順序排列
                main.refineNodeTable[columnIndex][rowIndex].value = main.refinedData[pageIndex][main.columnSequence[columnIndex]][rowIndex] || "";
                main.refineNodeTable[columnIndex][rowIndex].node.textContent = main.refineNodeTable[columnIndex][rowIndex].value;
            }
        }
    };
    this.display_data_canvas = function (pageIndex) {
        var main = this,
            ctx = main.gridElement.getContext("2d");
        for (var columnIndex = 0; columnIndex < main.refineNodeTable.length; columnIndex++) {
            for (var rowIndex = 0; rowIndex < main.refineNodeTable[columnIndex].length; rowIndex++) {
                ////console.log("順序", main.columnSequence[columnIndex], main.refinedData[pageIndex][main.columnSequence[columnIndex]][rowIndex]);
                //欄位資料依據欄位陣列順序排列
                main.refineNodeTable[columnIndex][rowIndex].value = main.refinedData[pageIndex][main.columnSequence[columnIndex]][rowIndex] || "";
                //設定psuedoDOM資料
                main.refineNodeTable[columnIndex][rowIndex].node.textContent = main.refineNodeTable[columnIndex][rowIndex].value;
                //main.refineNodeTable[columnIndex][rowIndex].node.refresh_textContent(ctx);//刷新canvas
                main.refineNodeTable[columnIndex][rowIndex].node.translate_and_refresh_textContent(ctx);
            }
        }
    };
    /*
        欄位數據交換
    */
    //11.欄位拖曳資料交換事件綁定--作欄與欄資料交換(Closure)
    this.event_bind_header = function () {
        var main = this,
            selectColumnA = -1,
            selectColumnB = -1;
        main.refineNodeTable.forEach(function ( current, index, array) {
            if ('header' === current[0].type) {
                var i = 0;
                ////console.log("Header", current);
                current[0].node.ondragstart = function (e) {
                    e.stopPropagation();
                    selectColumnA = index;//紀錄起始拖曳的索引值
                    this.style.opacity = "0.4";

                    //console.log('start', selectColumnA);
                };
                current[0].node.ondragend = function (e) {
                    e.stopPropagation();
                    this.style.opacity = "";
                    //console.log("dragend event", ++i);
                };

                //拉起來後就會一直不斷的觸發(即使滑鼠不動)--這是只要拉起來
                //current[0].node.ondrag = function (e) {
                //    //console.log("drag event", e.currentTarget.textContent, ++i);
                //};
                //拉起來後就會一直不斷的觸發(即使滑鼠不動)--這是只要經過有的拖易物件滑過去,就會觸發
                current[0].node.ondragover = function (e) {
                    e.stopPropagation();
                    // prevent default to allow drop,By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element.
                    e.preventDefault();//一定要終止此預設行為才能引發drop事件
                    //console.log("dragover event", e.currentTarget.textContent, ++i);
                };
                //用來改拖曳進入時的元素底色
                current[0].node.ondragenter = function (e) {
                    e.stopPropagation();
                    //console.log("dragendter event", e.currentTarget.textContent, ++i);
                    this.style.backgroundColor = "yellow";
                };
                //用來還原拖曳離開時的元素底色(改回原來的)
                current[0].node.ondragleave = function (e) {
                    e.stopPropagation();
                    //console.log("dragendter event", e.currentTarget.textContent, ++i);
                    this.style.backgroundColor = "rgb(120, 207, 207)";
                };
                //拖曳放下確定時
                current[0].node.ondrop = function (e) {
                    e.stopPropagation();
                    this.style.backgroundColor = "rgb(120, 207, 207)";
                    ////console.log("drop event", e, ++i);
                    selectColumnB = index;//紀錄結束拖曳的索引值
                    ////console.log('end', selectColumnB);
                    main._swap(main.columnSequence, selectColumnA, selectColumnB);//交換起始與結束的索引順序
                    main._swap_columnSortNode_sortName(selectColumnA, selectColumnB);//交換排序的欄位數據
                    main.display_data_canvas(main.currentPage);
                };
                //若有drag事件就不會有mouseup事件
                //current[0].node.onmouseup = function (e) {
                //    //console.log("mouseup  event", e.currentTarget.textContent,++i);
                //};
                //current[0].node.onmousedown = function (e) {
                //    //console.log('mouse down', e);
                //};
            }
        })
    };
    //(私)物件屬性値交換
    this._swap = function(ary,a,b){
        var tmp = ary[a];
        ary[a] = ary[b];
        ary[b] = tmp;
    };
    /*
        欄位排序元件
    */
    //12.建立欄位排序元件
    this.createSortNodeList = function () {
        var main = this,
            tmpNodes;
        //create column sort elements
        main.columnSortedRootNode = main.new.create('div', main.column, 'triangle_up');
        main.columnSortedRootNode.classList.remove("triangle_up");
        main.columnSortedRootNode.setAttribute("id", "sortList");
        tmpNodes = Array.prototype.slice.call(main.columnSortedRootNode.children);//

        //set property into main object //iterator
        tmpNodes.forEach(function (currentElement, index, array) {
            var default_left = ((main.columnWidth * (index + 1))) - 15,//每個sort node的預設 X axis 位置
            //建立縮放元素(flexi bar)的資料結構
            data = {
                index: index,               //第幾條
                node: currentElement,       //DOM元素
                default_left:default_left,
                nodeCSS: {                  //設定用CSS
                    position: "absolute",
                    //border: "1px solid yellow", //只是用來看元件位置
                    //backgroundColor: "red",
                    //width: "10px",
                    //height: "10px",
                    visibility:"visible",
                    left: default_left + "px",
                    top: "5px"
                },
                columnSortName: "",
                dataType:"",
                type: "column_sort"            //物件種類
            };
            main.columnSortNodeList.push(data);//加入columnSortNodeList陣列
        });
        //輸出到Grid元素上
        main.mainElement.appendChild(main.columnSortedRootNode);
    };
    //(私)數據注入時,刷新columnSortName屬性值
    this._refresh_columnSortName = function () {
        var main = this,
            dataType = //['number', 'number', 'number', 'number', 'number'];   //kai的json數據
                       ['number', 'date', 'string', 'string', 'string'];  //借來的json數據
        main.columnSortNodeList.forEach(function (currentElement, index, array) {
            currentElement.columnSortName = main.refineNodeTable[main.columnSequence[index]][0].value;//取得json物件的屬性名稱(當排序的依據條件)
            currentElement.dataType = dataType[index];
        });
    }
    //13.刷新所有排序欄位元素的CSS或指定的CSS屬性
    this.set_columnSortNode_CSS = function (mainObj, columnIndex, propertyName) {
        var main = this;
        var main = mainObj || this;
        
        //設定所有縮放元素,若有指定起始index則取指定値當起始値
        for (var index = columnIndex || 0; index < main.columnSortNodeList.length; index++) {
            //若有指定設定名稱
            if (!!propertyName) {
                main.columnSortNodeList[index].node.style[propertyName] = main.columnSortNodeList[index].nodeCSS[propertyName];
            }
            else {
                //設定所有Css Style
                for (var property in main.columnSortNodeList[index].nodeCSS) {
                    main.columnSortNodeList[index].node.style[property] = main.columnSortNodeList[index].nodeCSS[property];
                }
            }
        }
    }
    //14.欄位排序元素click事件綁定
    this.bind_event_columnSortNode = function () {
        var main = this;
        main.columnSortNodeList.forEach(function (current, index, array) {
            var isToogle = false;//紀錄click的狀態
            current.node.onclick = function (event) {
                var sortName = main.columnSortNodeList[index].columnSortName,   //排序的指定欄位名稱
                    dataType = main.columnSortNodeList[index].dataType,         //排序的指定欄位資料格式
                    data = main.data[main.dataIndex],                           //排序的指定資料來源
                    newData;                                                    //排序完的新自訂資料物件[頁][欄][列]=>値
                /************************************************/
                /*
                    排序的CSS shape change
                */
                if (isToogle = !isToogle) {
                    current.node.classList.remove("triangle_up");
                    current.node.classList.add("triangle_down");
                }
                else {
                    current.node.classList.remove("triangle_down");
                    current.node.classList.add("triangle_up");
                }
                /************************************************/
                /*
                    依據條件重新排序數據
                */
                //若此欄位沒排序過
                if (!main.sortedObject[sortName]) {
                    //重新計算與排序
                    newData = main.quickSort(data, sortName, dataType);
                    //加入排序物件
                    main.sortedObject[sortName] = newData;
                }
                //反轉陣列
                main.sortedObject[sortName] = main.sortedObject[sortName].reverse();
                //重新定義數據元件
                main.refine_JsonData(main.sortedObject[sortName]);
                ////console.log('sorted', sortName);
                //重新刷新指定頁物件並回到第一頁
                main.refresh_specifiedPageControl_pageIndex(1);
                //main.pageControl.specifiedPageList[(main.currentPage - 1) % 10]
                main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                ////console.log('sorted', main.refinedData);
            };
        });
    };
    //(私)排序元件的屬性(欄位名稱與資料格式)交換
    this._swap_columnSortNode_sortName = function (index1,index2) {
        var main = this;
        var tmpColumnSortName,
            tmpDataType;
        tmpColumnSortName = main.columnSortNodeList[index1].columnSortName;
        tmpDataType = main.columnSortNodeList[index1].dataType;
        main.columnSortNodeList[index1].columnSortName = main.columnSortNodeList[index2].columnSortName;
        main.columnSortNodeList[index1].dataType = main.columnSortNodeList[index2].dataType;
        main.columnSortNodeList[index2].columnSortName = tmpColumnSortName;
        main.columnSortNodeList[index2].dataType = tmpDataType;
    }
    //快速排序法(被比較的陣列,比較的物件屬性,比較的數據類型)
    this.quickSort = function quick_Sort (ary, conditionName, type) {
        var len = ary.length;
        if (len <= 1) {
            return ary.slice(0);
        }
        var left = [],
            right = [],
            mid = [ary[0]];//指標為輸入陣列的第0個
        for (var i = 1; i < len; i++) {
            /*************************************************************************************/
            var compared = false;
            switch (type) {
                //日期比較
                case 'date'://((!isNaN(Date.parse(ary[i][conditionName]))) && (!isNaN(Date.parse(mid[0][conditionName])))):
                    //Date
                        ////console.log(data1, data2, (new Date(data1).getTime()), (new Date(data2).getTime()));
                        compared = ((new Date(ary[i][conditionName]).getTime()) < (new Date(mid[0][conditionName]).getTime()));
                    
                    break;
                    //數字比較
                case 'number'://((!isNaN(Number(ary[i][conditionName]))) && (!isNaN(Number(mid[0][conditionName])))):
                        compared = parseInt(ary[i][conditionName], 10) < parseInt(mid[0][conditionName], 10);
                        break;
                    /*
                    //字串比較(不比較字串,資料太多會stack over flow)
                case "string":
                    //console.log('開始比較字串');
                    //字串1長度少於字串2
                    if (ary[i][conditionName].length < mid[0][conditionName].length) {
                        compared = true;
                    }
                        //字串1長度大於字串2
                    else if (ary[i][conditionName].length > mid[0][conditionName].length) {
                        compared = false;
                    }
                    else {
                        //字串1長度等於字串2
                        for (var i = 0; i < ary[i][conditionName].length; i++) {
                            //只要有一個字元(字串1)大於字串2的
                            if (ary[i][conditionName].charCodeAt(i) > mid[0][conditionName].charCodeAt(i)) {
                                compared = false;
                            }
                        }
                        compared = true;
                    }
                    break;
                    */
                default:
                    compared = false;
            }
            /*************************************************************************************/
            if (compared) {//main._select_Compare(ary[i][conditionName],mid[0][conditionName],type)){//(ary[i][conditionName] < mid[0][conditionName]) {
                left.push(ary[i]);//左邊放比指標小的
            }
            else {
                right.push(ary[i]);//右邊放比指標大的
            }
        }
        //將左邊遞迴完的陣列串聯中間的再串聯右邊遞迴完的陣列
        return quick_Sort(left, conditionName, type).concat(mid.concat(quick_Sort(right, conditionName, type)));
    };
    //(棄用)依據比較的類型選擇比較方式並回傳比較結果(true/false)
    this._select_Compare = function (data1, data2, type) {
        switch (type) {
            //日期比較
            case "date":
                ////console.log(data1, data2, (new Date(data1).getTime()), (new Date(data2).getTime()));
                return ((Date.parse(data1)) < (Date.parse(data2)));
            //字串比較
            case "string":
                //字串1長度少於字串2
                if(data1.length < data2.length){
                    return true;
                }
                    //字串1長度大於字串2
                else if(data1.length > data2.length){
                    return false;
                }
                else {
                    //字串1長度等於字串2
                    for (var i = 0; i < data1.length; i++) {
                        //只要有一個字元(字串1)大於字串2的
                        if (data1.charCodeAt(i) > data2.charCodeAt(i)) {
                            return false;
                        }
                    }
                    return true;
                }
            //數字比較
            case "number":
                return parseInt(data1) < parseInt(data2);
        }
    };
    /*
        Slider
    */
    this.createSlider = function () {
        //console.log("新增Slider物件");
        var that = this;
        that.slider = new Slider();
        that.slider.appendToNode(that.mainElement);
        that.slider.set_minValue(that.width);
        that.slider.set_maxValue(that.width);
        //設定Slider物件委派方法的指標(即slider那邊的事件會回傳需要的translate數據回來再用table物件的方法來做刷新畫面:控制權在此)
        that.slider.delegateFunctionPoint = function (x,y) {
            that.translate_and_refresh_grid.call(that, x, y);//變更this指向的物件
        }
    };
    //delegate function point 委派給Slider並利用slider的事件代為執行並回傳translate所需x軸和y軸的變化數據
    this.translate_and_refresh_grid = function (x, y) {
        ////console.log("deleFunction:this", this, "x", x, "y", y);//預期this要指到tablemanager_canvas物件才對
        var main = this,
            ctx = main.gridElement.getContext("2d");
        main.refineNodeTable[0][0].node.set_translate(x, y);//因所有instance物件都參考prototype的屬性値,所以只需改1次prototype的值(即全部pseudoDOM都會做同樣的位移:[ctx.translate])
        //刷新Grid元件的畫面
        for (var columnIndex = 0; columnIndex < main.refineNodeTable.length; columnIndex++) {
            for (var rowIndex = 0; rowIndex < main.refineNodeTable[columnIndex].length; rowIndex++) {
                ////console.log("執行委派任務", x, y);
                //main.refineNodeTable[columnIndex][rowIndex].node.set_translate(x, y);
                main.refineNodeTable[columnIndex][rowIndex].node.translate_and_refresh_textContent(ctx);
            }
        }
        //刷新Resize元件位置
        main._refresh_from_Slider(main, x, 'left');
        //main._update_ResizeBar_last_Xdeviation(main, ResizeBarIndex, main.ResizeBar_X_rangeList[ResizeBarIndex]);
    };
    //依據Slider的x軸變化來刷新畫面(有問題,移動slider會造成x_deviation 增加,下次再移動resizebar的x_deviatino就錯了[會加上slider的移動量*ratio])
    this._refresh_from_Slider = function (mainObj, x_range, propertyName) {
        var ctx = mainObj.gridElement.getContext("2d");//取得canvas的context
        var lastResizBar_Left = 0;//最後一根ResizeBar的位置
        for (var index = 0 ; index < mainObj.ResizeBarNodeList.length; index++) {
            /**********************************************************/
            //(指定的拖曳軸)預設left + 上次變化量 + 本次變化量 => (指定拖曳軸)本次所需移動的left位置
            var resizeBar_Left = (mainObj.ResizeBarNodeList[index].default_left + mainObj.ResizeBarNodeList[index].X_deviation + x_range);
            //console.log("")
            /*******更新flexi bar條*******/
            //更新flexi bar的nodeCSS內指定的屬性值
            mainObj.ResizeBarNodeList[index].nodeCSS[propertyName] = resizeBar_Left + "px";
            //更新flexi bar元素的指定CSS style
            mainObj.ResizeBarNodeList[index].node.style[propertyName] = mainObj.ResizeBarNodeList[index].nodeCSS[propertyName];

            //debugger;
            /**********************************************************/
            /*
                更新排序元件位置
            */
            mainObj.columnSortNodeList[index].nodeCSS[propertyName] = resizeBar_Left - 15 + "px";
            mainObj.columnSortNodeList[index].node.style[propertyName] = mainObj.columnSortNodeList[index].nodeCSS[propertyName];
            //超出Grid範圍就隱藏DOM
            if (resizeBar_Left - 15 > mainObj.width || resizeBar_Left < 10) {
                mainObj.columnSortNodeList[index].nodeCSS["visibility"] = "hidden";
                mainObj.columnSortNodeList[index].node.style["visibility"] = mainObj.columnSortNodeList[index].nodeCSS["visibility"];
            }
            else {
                mainObj.columnSortNodeList[index].nodeCSS["visibility"] = "visible";
                mainObj.columnSortNodeList[index].node.style["visibility"] = mainObj.columnSortNodeList[index].nodeCSS["visibility"];
            }
        }
    };
};
//shared method
TableManager.prototype.new = {
    //建立元素集合的節點 tagName=建立的元素名稱, amount=子元素的數量, className=元素類別名稱
    create: function (tagName, amount, className) {
        var parser = new DOMParser();
        var childString = "";//temp
        var classAttribute = className ? (' class="' + className + '"') : "";
        var rootElement, docHtml;
        //串子元素字串
        for (var count = 0; count < amount; count++) {
            childString += "<" + tagName + classAttribute + ">" + "</" + tagName + ">";
        }
        //加上一個root元素
        childString = "<" + tagName + classAttribute + ">" + childString + "</" + tagName + ">";
        ////console.log(childString);
        docHtml = parser.parseFromString(childString, "text/html");
        rootElement = docHtml.getElementsByTagName(tagName)[0];
        //console.log('create new DOM',rootElement);
        return rootElement;
    },
    //create single element and set class name
    createElement:function(tagName,className){
        var tmp = document.createElement(tagName);
        if (className) {
            tmp.classList.add(className)
        }
        //console.log("create Element", tmp);
        return tmp;
    },
    //
    createSVG: function (subNode){
        var svg = document.createElementNS(null, "http://www.w3.org/2000/svg", "svg");
        svg.appendChild(subNode);
        return svg;
    },
    //建立SVG的polygon元素並設定座標點位置(x1,y1,x2,y2,x3,y3,x4...)
    createPolygonNode: function () {
        var pointList = [];
        this.node = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        this.build = function (arg) {
            var res = [];
            for (var i = 0, l = arg.length; i < l; i++) {
                res.push(arg[i].join(','));
            }
            return res.join(' ');
        };
        //attribute get and set operator
        this.attribute = function (key, val) {
            if (val === undefined) return node.getAttribute(key);
            this.node.setAttribute(key, val);
        };
        //get point array
        this.getPoint = function (i) {
            return pointList[i];
        };
        //set point araay and points attribute
        this.setPoint = function (i, x, y) {
            pointList[i] = [x, y];
            this.attribute('points', build(pointList));
        };
        //set point by arguments
        this.points = function () {
            for (var i = 0, l = arguments.length; i < l; i += 2) {
                pointList.push([arguments[i], arguments[i + 1]]);
            }
            this.attribute('points', build(pointList));
        };
        // initialize 'points':
        this.points.apply(this, arguments);
    },
    //元素增加某個class
    addClass: function (element, className) {
        if (!(element instanceof HTMLElement)) {
            throw new Error("注入元素非HTML物件");
        }

        if (this.isClassExist(className) && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    },
    //若class存在於document內則回傳true,否則回傳false
    isClassExist: function (className) {
        var allStyleSheets = window.document.styleSheets;//get all style sheet include extent or intern at document load
        //search all styleSheet
        for (var styleSheetIndex = 0; styleSheetIndex < allStyleSheets.length; styleSheetIndex++) {
            var rules = allStyleSheets[styleSheetIndex].cssRules || allStyleSheets[styleSheetIndex].rules;
            //search all rules or cssRules
            for (var ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
                if (className === rules[ruleIndex].selectorText) {
                    return true;
                }
            }
        }
        return false;
    },
    //元素移除某個class
    removeClass: function (element, className) {
        if (!(element instanceof HTMLElement)) {
            throw new Error("注入元素非HTML物件");
        }
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        }
    },
};
//Old Version(棄用)
TableManager.prototype.old = {
    //建立並回傳新table DOM元素,使用DOMParser
    //rows=表格列數量,column=表格欄數量,tableId=設定table的id屬性名稱,tbClassName=所有欄位的class屬性名稱,flexibleBar=表示是否加入可拉縮的元素
    createTable: function (rowCount, columnCount, tableAttributeString, cellAttributeString, hasFlexibleBar) {
        
        //elements
        var tableAttr = !!tableAttributeString ? (" " + tableAttributeString.trim() + " ") : "";
        var cellAttr = !!cellAttributeString ? (" " + cellAttributeString.trim() + " ") : "";
        var rows = rowCount || 0;
        var columns = columnCount || 0;
        var td = "";
        var th = "";
        var tr = "";
        var thead = "";
        var tbody = "";
        var table = "";
        var docHtml;
        var element;
        var parser = new DOMParser();

        //td collection
        for (var j = 0; j < columns; j++) {
            th += '<th' + cellAttr + '>' + (!!hasFlexibleBar ? '<span style="margin-right: 0px;' +
                                                             'padding:0px 0px;' +
                                                             'height: 30px;' +
                                                             'border:1px solid rgba(0,0,0,0);' +
                                                             'float:right;' +
                                                             'cursor:col-resize;" class="vertical' + j + '"></span>'
                                                             :
                                                             '') + '</th>';
            td += '<td' + cellAttr + '>' + (!!hasFlexibleBar ? '<span style="margin-right: -5px;' +
                                                             'padding:0px 0px;' +
                                                             'height: 30px;' +
                                                             'border:3px solid red;' +
                                                             'float:right;' +
                                                             'cursor:col-resize;" class="vertical' + j + '"></span>' : '') + '</td>';
        }

        //tr + td collection
        for (var i = 0; i < rows; i++) {
            tr += "<tr>" + td + "</tr>" +
            (!!hasFlexibleBar ? '<tr><td colspan="' + columns + '" style="margin:0px 0px;' +
                                                                'width:0px;' +
                                                                'height:0px;' +
                                                                'padding:0px 0px;' + 
                                                                'border:1px solid rgba(0,0,0,0);' +
                                                                'cursor:row-resize;' +
                                                                'class="horizontal' + (i + 1) + '"></td></tr>'
                           : '');
        }

        thead = "<thead><tr>" + th + "</tr>" + (!!hasFlexibleBar ? '<tr><td colspan="' + columns + '" style="margin:0px 0px;' +
                                                                'width:0px;' +
                                                                'height:0px;' +
                                                                'padding:0px 0px;' +
                                                                'border:1px solid rgba(0,0,0,0);' +
                                                                'cursor:row-resize;' +
                                                                'class="horizontal0"></td></tr>'
                                                : '') + "</thead>";
        tbody = '<tbody>' + tr + '</tbody>';
        table = '<table' + tableAttr + '>' + thead + tbody + '</table>';
        //console.log('table字串=>',table);
        docHtml = parser.parseFromString(table, 'text/html');
        element = docHtml.getElementsByTagName('table')[0];

        //release
        parser = null;
        docHtml = null;

        return element;
    },

    //元素增加某個class
    addClass: function(element,className){
        if (!(element instanceof HTMLElement)) {
            throw new Error("注入元素非HTML物件");
        }

        if (this.isClassExist(className) && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    },
    //若class存在於document內則回傳true,否則回傳false
    isClassExist: function(className){
        var allStyleSheets = window.document.styleSheets;//get all style sheet include extent or intern at document load
        //search all styleSheet
        for (var styleSheetIndex = 0; styleSheetIndex < allStyleSheets.length; styleSheetIndex++) {
            var rules = allStyleSheets[styleSheetIndex].cssRules || allStyleSheets[styleSheetIndex].rules;
            //search all rules or cssRules
            for (var ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
                if (className === rules[ruleIndex].selectorText) {
                    return true;
                }
            }
        }
        return false;
    },
    //元素移除某個class
    removeClass: function(element,className){
        if (!(element instanceof HTMLElement)) {
            throw new Error("注入元素非HTML物件");
        }
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        }
    },
    //插入資料到表格元素
    //dataObj=資料陣列(裡面元素為{xxx:'xx'}),dataStartIndex=設定讀取的資料起始位置,tableElement=要改變資料的table元素
    insertData: function (dataAry, dataStartIndex, tableElement) {
        var startIndex = dataStartIndex || 0;
        var keys;
        var trElements;

        if (!(dataAry instanceof Array)) {
            console.error('插入資料非陣列元素!');
            return;
        }

        keys = Object.getOwnPropertyNames(dataAry[0]);
        //tableElement.querySelectorAll('td[class^=vertical]');
        trElements = tableElement.querySelectorAll('tr');//td:not([class^=horizontal])');//不包含列縮放的元素
        console.dir(trElements);
        //clear table cell value
        for (var i = 0; i < trElements.length; i++) { //tr
            for (var j = 0; j < trElements[i].children.length; j++) { //td or th
                //th
                if (trElements[i].children[j].nodeName.toUpperCase() == 'TH') {
                    trElements[i].children[j].textContent = keys[j];//setting th[i]'s value
                }
                    //tr
                else {
                    //check data length if not overflow 
                    if ((i + startIndex - 1) < dataAry.length) {
                        //console.log(('dataObj[' + (i + startIndex - 1) + '][' + keys[j] + ']'), dataAry[i + startIndex - 1][keys[j]]);
                        trElements[i].children[j].textContent = dataAry[i + startIndex - 1][keys[j]];
                    }
                    else {
                        trElements[i].children[j].textContent = '';
                    }
                }
            }
        }
    },
    //展現資料
    //element=要插入的DOM元素, parentElement=要展示資料的父元素, insertBefore=插入在父元素裡面的前面(true)或後面(false)
    display: function (element, parentElement, insertBefore) {
        if (!(parentElement instanceof HTMLElement) || !(element instanceof HTMLElement)) {
            //console.log('parameter is not a HTMLElement!!!', element, parentElement);
            return;
        };
        if (!insertBefore) {
                parentElement.appendChild(element);
        }
        else {
            parentElement.insertBefore(element, parentElement.firstChild); 
        }
    },
};
var testOnconsole;
//**********************************************

function refinedFunction(data) {
    var result = [],
        header;
    if (Array.isArray(data)) {
        try {
            for (var outerIndex = 0; outerIndex < data.length; outerIndex++) {
                if (outerIndex === 0) {
                    //過濾非字串
                    header = data[outerIndex].filter(function (element, index, array) {
                        return (typeof (element) === 'string') && (element.length > 0);
                    });
                    //console.log('header',header);
                }
                else {
                    var obj = {};
                    for(var innerIndex = 0; innerIndex < data[outerIndex].length; innerIndex++){
                        obj[header[innerIndex]] = data[outerIndex][innerIndex].toString();
                    }
                    result.push(obj);
                }
            }
        }
        catch (e) {
            throw new Error('重新定義數據異常:' + e.stack);
        }
    }
    else {
        throw new Error('輸入的資料非陣列,無法重新定義');
    }
    return result;
};

