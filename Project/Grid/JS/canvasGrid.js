/*
    canvas Grid
*/

var Grid = function (obj) {
    /*
        Property
    */
    //原始JSON數據
    this.data = [];
    //目前所使用的數據資料
    this.dataIndex = -1;
    //重新定義的資料物件
    this.refinedData = [];
    //外部來源主DOM
    this.mainElement = obj.mainElement;
    //總寬度(含border,padding,不含scrollBar)
    this.width = obj.width || obj.mainElement.offsetWidth;
    //總高度(含border,padding,不含scrollBar)
    this.height = obj.height || obj.mainElement.offsetHeight;
    //欄數
    this.column = obj.column || 5;
    //列數
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
    this.ResizeBar_rangeList = {};
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
    this.pageControlRootNode;
    //page control array
    this.pageControl = new function () {
        //page control(increment) kind
        this.textValue = ['min', '-10', '-1', 'Status', '+1', '+10', 'max'];
        //page control(increment) default image
        this.defaultImg = {
            left_end: '/Project/Grid/CSS/ICON/left_end.png',
            left_double_arrow: '/Project/Grid/CSS/ICON/double_arrow_left.png',
            left_arrow: '/Project/Grid/CSS/ICON/arrow_left.png',
            right_arrow: '/Project/Grid/CSS/ICON/arrow_right.png',
            right_double_arrow: '/Project/Grid/CSS/ICON/double_arrow_right.png',
            right_end: '/Project/Grid/CSS/ICON/right_end.png'
        };
        this.incrementPageList = [];
        this.specifiedPageList = [];
    };
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
    //Grid事件搜尋的優先順序之物件列表
    this.gridSearchPriorityList = [];
    //PageControl事件搜尋的優先順序之物件列表
    this.pageSearchPriorityList = [];
    //縮放的水平軸滑桿元件
    this.slider_X_Bar;
    //縮放的水平軸滑桿元件外框
    this.slider_X_OuterFrame;
    //計算slider比例的元件
    this.sliderProportion;
    //初始化
    this.init = function () {
        //1.建立展示資料元素
        this.createDisplayNode();
        //2.重新定義元素結構
        this.redefineGridNodesStruct();
        //2-1.設定欄位順序陣列
        this.set_columnSequenceArray();
        //3.刷新Grid的dispaly cell物件
        this.refresh_allDisplayElement();
        //4.建立縮放元件
        this.createResizeBar();
        // 建立slider bar 元件
        this.createSlider();
        //
        this.add_slidersToSeachList();
        //5.建立(遞增或遞減)切頁元件
        this.createIncrementPageControl();
        //6.刷新(遞增或遞減)切頁元件
        this.refresh_incrementPageControl();
        //7.將遞增或遞減物件的node部分(cell_canvas)抽出丟入切頁搜尋列表
        this.add_searchList_incrementPageControl();
        //8.建立(指定頁)切頁元件(1~10頁)與設定預設値
        this.createSpecifiedPageControl();
        //9.刷新(指定頁)切頁元件
        this.refresh_specifiedPageControl();
        //10.將指定頁物件的node部分(cell_canvas)抽出丟入切頁搜尋列表
        this.add_searchList_specifiedPageControl();

        //11.欄位拖曳資料交換事件綁定--作欄與欄資料交換
        //this.event_bind_header();
        //12.建立欄位排序元件
        this.createSortNodeList();
        //13.刷新欄位排序元件
        //this.refresh_columnSortNode();
        //14.欄位排序元素click事件綁定
        this.add_columnSortNodesToSeachList();
        //15.將header元件加入事件搜尋列表
        this.add_headersToSeachList();
        //Grid (first canvas DOM)事件綁定
        this.bind_event_grid();
        //切頁控制(second canvas DOM)事件綁定
        this.bind_event_pageControl();
    };
    /*
        資料表格元件
    */
    //1.建立展示資料元素
    this.createDisplayNode = function () {
        //建立展示資料元素
        this.gridElement = this.shared.createElement('canvas', 'grid');
        this.gridElement.setAttribute('width', this.width);// + 50);
        this.gridElement.setAttribute('height', this.height);
        //this.gridElement.style.cssText = "border:3px solid red;padding:10px 10px;";
        this.mainElement.appendChild(this.gridElement);
    };
    //2.設定自定義的node結構
    this.redefineGridNodesStruct = function () {
        const main = this;
        const container = [];                   //頁
        //const innerContainer = [];              //欄 used es6 array copy [...innerContainer]
        const len = main.column * main.row;     //total cells 
        const averageWidth = main.columnWidth;
        var isHeader;
        var type;
        var attributes;
        var rowIndex;
        var columnIndex;
        var default_Left;
        var backgroundColor;
        var border = 1;
        var node;
        //set every column width and height(設定欄位平均寬度和厚度)
        main.columnWidth = (main.width / main.column);
        main.rowHeight = (main.height / main.row);

        for (var elementIndex = 0; elementIndex < len; elementIndex++) {
            isHeader = (elementIndex % main.row === 0);
            type = isHeader ? "header" : "cell";
            backgroundColor = isHeader ? "rgb(120, 207, 207)" : "rgb(174, 233, 233)";
            attributes = isHeader ? { draggable: true } : {};
            rowIndex = (elementIndex % main.row);
            columnIndex = Math.floor(elementIndex / this.row);
            default_Left = (columnIndex * main.columnWidth);
            node = new Cell_canvas(columnIndex + "-" + rowIndex, elementIndex);
            node.set_info(type, columnIndex, rowIndex);
            node.set_Style((columnIndex * main.columnWidth),               //x axis 列導向所以相反
                           (rowIndex * main.rowHeight),                    //y axis
                           main.columnWidth,                               //width
                           main.rowHeight,                                 //height
                           backgroundColor,                                //backgound color
                           border);                                        //border width

            //[[{}]] => column( row( data Object ) )
            //若不存在建立新的陣列容器
            if (!container[node.columnIndex]) {
                //container.push([...innerContainer]);//es6 array copy not support on vs2013 but browser is support
                container.push([]);
            }
            //自訂物件推入array
            container[node.columnIndex].push(node);
        }
        console.log('refine result', container);
        //結果輸出
        main.refineNodeTable = container;
        //加入搜尋點擊列表
        //main.gridSearchPriorityList.push(main.refineNodeTable);
    };
    //2-1.設定欄位順序陣列
    this.set_columnSequenceArray = function () {
        var main = this;
        main.refineNodeTable.forEach(function (current, index) {
            main.columnSequence.push(index);
        });

    };
    //3.刷新Grid內所有display shape
    this.refresh_allDisplayElement = function (mainObj, columnIndex) {
        const main = mainObj || this;
        const ctx = main.gridElement.getContext('2d');
        //清除整個畫布且重畫所有元件
        ctx.clearRect(0, 0, main.width, main.height);
        //refresh all display cell object
        for (var column_Index = columnIndex || 0; column_Index < main.column; column_Index++) {
            for (var rowIndex = 0; rowIndex < main.row; rowIndex++) {
                //get object point
                tempObj = main.refineNodeTable[column_Index][rowIndex];
                //draw this object
                tempObj.translate_and_refresh_textContent(ctx);
            }
        }
    };
    /*
        欄位縮放元件
    */
    //4.create flexi bar and initial property (flexi bar:控制Grid上每個欄位的寬度與位置)
    this.createResizeBar = function () {
        const main = this;
        var data;
        var settings;
        const type = "ResizeBar";
        //create resize object
        for (var index = 0; index < main.column; index++) {
            var default_left = ((main.columnWidth * (index + 1)));// - main.ResizeBarWidth),//每個flexi bar的預設 X axis 位置
            //建立縮放物件(flexi bar)的資料結構
            settings = {
                x:default_left,
                y:0,
                width:main.ResizeBarWidth,
                height:main.height
            };
            data = new Rectangle("ResizeBar" + index, index, settings, type);
            //if has forward object then set link 
            if (!!main.ResizeBarNodeList[index - 1]) {
                //current object set forward object link
                data.set_forwardObj(main.ResizeBarNodeList[index - 1]);
                //forward object set next object link
                main.ResizeBarNodeList[index - 1].set_nextObj(data);
            }
            //current object set children list
            data.set_childrenArray(main.refineNodeTable[index]);
            //console.log(currentElement);
            main.ResizeBarNodeList.push(data);//加入主物件
        };
        
        //TODO ... 需加入委派的方法 1.要改sort位置 2.要改每個display的cell的位置和寬度 3.要改slider bar的寬度 後面再加
        main.gridSearchPriorityList.unshift(main.ResizeBarNodeList);//加入搜尋列表...放前面
    };
    /*
        Slider bar元件
    */
    this.createSlider = function () {
        const main = this;
        const sliderBarTypeName = 'sliderBar';
        const sliderOuterFrametypeName = 'sliderOuterFrame';
        //slider shape 位置與大小資訊
        const sliderBarSettings = new function () {
            this.x = 0;
            this.y = main.height - 7;
            this.width = main.width;
            this.height = 7;
        };
        const sliderOuterFrameSettings = new function () {
            this.x = 0;
            this.y = main.height - 5;
            this.width = main.width;
            this.height = 5;
        };

        //1.create slider bar
        main.slider_X_Bar = new Rectangle(sliderBarTypeName, 0, sliderBarSettings, sliderBarTypeName, '#3399CC'/*'greenyellow'*/, 0);
        //(覆蓋原來的定位方法:此物件不需要加入translate長度)檢查是否在物件的範圍內
        main.slider_X_Bar.hitCheck = function (x, y) {
            const that = this;
            //判斷長方形範圍
            if (x > (that.settings.x + that.tempSettings.x) &&
               x < (that.settings.x + that.tempSettings.x + that.settings.width + that.tempSettings.width) &&
               y > (that.settings.y + that.tempSettings.y) &&
               y < (that.settings.y + that.tempSettings.y + that.settings.height + that.tempSettings.height)) {
                return true;
            }
            return false;
        };
        //(覆蓋原來的位移方法:此物件不需要加入translate長度)
        main.slider_X_Bar.translate = new canvas_translate(0, 0);
        //2.create the outer frame
        main.slider_X_OuterFrame = new Rectangle(sliderOuterFrametypeName, 1, sliderOuterFrameSettings, sliderOuterFrametypeName, 'white', 0);
        
        //3.create slider proportion
        main.sliderProportion = new Proportion(0, 'slider_X_Proportion', main.width, sliderBarSettings.width);
        //console.log('Slider Component', main.slider_X_Bar, main.slider_X_OuterFrame, main.sliderProportion);
    };
    //將Slider bar和外框加入grid定位搜尋列表
    this.add_slidersToSeachList = function () {
        const main = this;
        main.gridSearchPriorityList.push([main.slider_X_Bar, main.slider_X_OuterFrame]);
    }
    //輸出Slider bar到grid上
    this.refresh_slider = function (ctx) {
        const main = this;
        //比例計算的最大範圍若超過最小範圍才畫出(即grid的每個cell被放大後的總寬度必須比畫布寬度大)
        if (main.sliderProportion.origin_val < main.sliderProportion.float_val) {
            var tmpCtx = ctx || main.gridElement.getContext('2d');
            main.slider_X_OuterFrame.draw(tmpCtx);
            main.slider_X_Bar.draw(tmpCtx);
        }
    };
    /*
        切頁元件
    */
    //5.建立(遞增或遞減)切頁元件(只有7個control:首頁,遞增1或10頁,遞減1或10頁,末頁)
    this.createIncrementPageControl = function () {
        const main = this;
        var tmp_pageNode;
        var tmp_pageObject;
        //新增一個canvas DOM 來展示切頁物件
        main.pageControlRootNode = main.shared.createElement('canvas', 'pageControl');
        main.pageControlRootNode.width = main.width;
        main.pageControlRootNode.height = 50;
        //建立(遞增或遞減)切頁控制元件
        for (var index = 0; index < main.pageControl.textValue.length; index++) {
            tmp_pageNode = new Cell_canvas(main.pageControl.textValue[index], index);
            tmp_pageObject = main._get_incrementPageControl_Object(tmp_pageNode, index, main.pageControl.textValue[index]);
            //console.log('設定資訊',tmp_pageObject.nodeCSS.left, tmp_pageObject.nodeCSS.top, tmp_pageObject.nodeCSS.width, tmp_pageObject.nodeCSS.height);
            tmp_pageNode.set_Style(tmp_pageObject.nodeCSS.left, tmp_pageObject.nodeCSS.top,
                                   tmp_pageObject.nodeCSS.width, tmp_pageObject.nodeCSS.height,
                                   tmp_pageObject.nodeCSS.backgroundColor, 1);//set node position and width and height
            tmp_pageNode.set_info(main.pageControl.textValue[index], index, 1);
            tmp_pageNode.translate = new canvas_translate(0, 0);//or {x:0, y:0}//override translate prototype value //pageControl不能位移,所以不能和grid共用translate,所以要覆蓋
            main.pageControl.incrementPageList.push(tmp_pageObject);
        }
        //console.log('page Control increment', main.pageControl.incrementPageList);
        main.mainElement.appendChild(main.pageControlRootNode);
    };
    //(私)取得(遞增或遞減)切頁資料物件
    this._get_incrementPageControl_Object = function (node, index, category) {
        const main = this;
        const data = {
                index: index,
                node: node,
                nodeCSS: {
                    position: "absolute",
                    backgroundColor: "#e8f3f3",
                    border: "1px solid white",
                    //"border-radius": "10px",
                    width: 50,
                    height: 50,
                    top: 0,//(main.height + 12),
                    textAlign: "center",
                    //padding:"20px",
                    lineHeight: 50,  //textContent下移
                    visibility: "visible"
                },
                value: "",//category,
                category: category,
                type: category
            };
        switch (category) {
            case "Status":
                data.nodeCSS.width = (main.width * 10 / 16);//"100px";
                data.nodeCSS.left = (+main.pageControl.incrementPageList[index - 1].nodeCSS.width + +main.pageControl.incrementPageList[index - 1].nodeCSS.left);
                data.nodeCSS.top = -100;//隱藏用(讓滑鼠座標定位不到)
                data.nodeCSS.visibility = "hidden";//隱藏起來(暫時不用)
                break;
            case "-10":
                data.node.set_img_Path(main.pageControl.defaultImg.left_double_arrow);
                data.nodeCSS.width = (main.width / 16);//分成16等份來切區塊//"50px";
                data.nodeCSS.left = (+main.pageControl.incrementPageList[index - 1].nodeCSS.width + +main.pageControl.incrementPageList[index - 1].nodeCSS.left);
                break;
            case "-1":
                data.node.set_img_Path(main.pageControl.defaultImg.left_arrow);
                data.nodeCSS.width = (main.width / 16);//分成16等份來切區塊//"50px";
                data.nodeCSS.left = (+main.pageControl.incrementPageList[index - 1].nodeCSS.width + +main.pageControl.incrementPageList[index - 1].nodeCSS.left);
                break;
            case "+1":
                data.node.set_img_Path(main.pageControl.defaultImg.right_arrow);
                data.nodeCSS.width = (main.width / 16);//分成16等份來切區塊//"50px";
                data.nodeCSS.left = (+main.pageControl.incrementPageList[index - 1].nodeCSS.width + +main.pageControl.incrementPageList[index - 1].nodeCSS.left);
                break;
            case "+10":
                data.node.set_img_Path(main.pageControl.defaultImg.right_double_arrow);
                data.nodeCSS.width = (main.width / 16);//分成16等份來切區塊//"50px";
                data.nodeCSS.left = (+main.pageControl.incrementPageList[index - 1].nodeCSS.width + +main.pageControl.incrementPageList[index - 1].nodeCSS.left);
                break;
            case "max":
                data.node.set_img_Path(main.pageControl.defaultImg.right_end);
                data.nodeCSS.width = (main.width / 16);//分成16等份來切區塊//"50px";
                data.nodeCSS.left = (+main.pageControl.incrementPageList[index - 1].nodeCSS.width + +main.pageControl.incrementPageList[index - 1].nodeCSS.left);
                break;
            case "min":
                data.node.set_img_Path(main.pageControl.defaultImg.left_end);
                data.nodeCSS.width = 50;
                data.nodeCSS.left = 0;
                break;
            default:
                throw new Error("Page Control Category not defined");
        }
        return data;
    };
    //6.刷新(遞增或遞減)切頁元件
    this.refresh_incrementPageControl = function () {
        const main = this;
        const ctx = main.pageControlRootNode.getContext('2d');
        for (var index = 0; index < main.pageControl.incrementPageList.length; index++) {
            //paint image 
            main.pageControl.incrementPageList[index].node.refresh_imageContent(ctx);
        }
    };
    //7.將遞增或遞減物件的node部分(cell_canvas)抽出丟入切頁搜尋列表
    this.add_searchList_incrementPageControl = function () {
        const main = this;
        //抽出Cell_canvas物件的部分
        const incrementArr = main.pageControl.incrementPageList.map(function (object) {
            return object.node;
        });
        //console.log('increment List', incrementArr);
        //把Cell物件的陣列集合丟入切頁搜尋列表
        main.pageSearchPriorityList.push(incrementArr);
        /*
        main.pageControl.incrementPageList.forEach(function (current, index, array) {
            switch (current.category) {
                case "min":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        //
                        main.refresh_specifiedPageControl_pageIndex(1);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        console.log('切頁:min');
                    };
                    break;
                case "-10":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage - 10) >= 1) ? (main.currentPage - 10) : 1;
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        console.log('切頁: -10');
                    };
                    break;
                case "-1":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage - 1) >= 1) ? (main.currentPage - 1) : 1;
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        console.log('切頁: -1');
                    };
                    break;
                case "+1":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage + 1) <= (main.refinedData.length - 1)) ? (main.currentPage + 1) : (main.refinedData.length - 1);
                        console.log('+1', currentPage);
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        console.log('切頁: +1');
                    };
                    break;
                case "+10":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = ((main.currentPage + 10) <= (main.refinedData.length - 1)) ? (main.currentPage + 10) : (main.refinedData.length - 1);
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        console.log('切頁: +10');
                    };
                    break;
                case "max":
                    current.node.onclick = function (e) {
                        e.stopPropagation();
                        var currentPage = (main.refinedData.length - 1);
                        main.refresh_specifiedPageControl_pageIndex(currentPage);
                        //main.display_data(main.currentPage);
                        //main.pageControl.incrementPageList[3].node.textContent = main.currentPage + "/" + (main.refinedData.length - 1);
                        console.log('切頁:max');
                    };
                    break;
            }

        });
        */
    };
    //8.建立(指定頁)切頁元件(1~10頁)與設定預設値
    this.createSpecifiedPageControl = function () {
        const main = this;
        var tmp_pageNode;
        var tmp_pageObject;
        //建立(指定頁)控制元件
        for (var index = 0; index < 10; index++) {
            //新增cell物件當node
            tmp_pageNode = new Cell_canvas('specified', index);
            //設定外層物件並把cell物件加入到node屬性
            tmp_pageObject = main._get_specifiedPageControl_Object(tmp_pageNode, index, 'specified_page');
            //console.log('設定資訊',tmp_pageObject.nodeCSS.left, tmp_pageObject.nodeCSS.top, tmp_pageObject.nodeCSS.width, tmp_pageObject.nodeCSS.height);
            //設定寬高大小與位置與背景顏色和邊距
            tmp_pageNode.set_Style(tmp_pageObject.nodeCSS.left, tmp_pageObject.nodeCSS.top,
                                   tmp_pageObject.nodeCSS.width, tmp_pageObject.nodeCSS.height,
                                   tmp_pageObject.nodeCSS.backgroundColor, 1);//set node position and width and height
            //設定種類
            tmp_pageNode.set_info('specified_page', index, 1);//set object type
            //設定文字內容
            tmp_pageNode.set_textContent(tmp_pageObject.pageIndex);
            //設定文字置中
            tmp_pageNode.textAlign = 'center';
            //or {x:0, y:0}//override translate prototype value //pageControl不能位移,所以不能和grid共用translate,所以要覆蓋
            tmp_pageNode.translate = new canvas_translate(0, 0);//
            //儲存物件
            main.pageControl.specifiedPageList.push(tmp_pageObject);
        }
        console.log('specified page control', main.pageControl.specifiedPageList);
    };
    //(私)取得(指定)切頁資料物件
    this._get_specifiedPageControl_Object = function (node, index, category) {
        const main = this;
        var data = new function SpecifiedObject() {
            //物件索引
            this.index = index;
            //DOM元素
            this.node = node;
            //DOM對應的style設定
            this.nodeCSS = {
                position: "absolute",
                backgroundColor: "#e8f3f3",
                border: "1px solid white",
                //border-radius: "10px",
                width: (main.width / 16),
                height: 50,
                left: +main.pageControl.incrementPageList[2].nodeCSS.left + (main.width / 16 * (index + 1)),//起始位置從第3個開始
                top: 0,
                textAlign: "center",
                //padding:"20px",
                lineHeight: "50px",  //下移
                visibility: "visible"
            };
            //物件格式
            this.type = category;//"specified_page";
            //選擇flag
            this.selected = false;
            //頁數
            this.pageIndex = (index + 1);//初始的預設値: 1 ~ 10
            //
            this.set_select = function (flag) {
                this.selected = flag;
                this._change_backgroundColorStyle(this.selected);//依據flag變更css style
            };
            //
            this.get_select = function () {
                return this.selected;
            };
            //設定指定頁物件的pageIndex屬性
            this.set_pageIndex = function (pageIndex) {
                //檢查是否為數字
                var page = isNaN(Number(pageIndex)) ? undefined : pageIndex;
                this.pageIndex = page;
                this.node.textContent = this.pageIndex;
                //依據pageIndex屬性設定:若非數字則隱藏DOM元素
                this._change_visibility(this.pageIndex);
            };
            //取得指定頁物件的pageIndex屬性
            this.get_pageIndex = function () {
                return this.pageIndex;
            };
            //(private)chagne self css style
            this._change_backgroundColorStyle = function (flag) {
                this.nodeCSS.backgroundColor = !!flag ? "#3399FF" : "rgb(232, 243, 243)";
                this.node.set_backgroundColor(this.nodeCSS.backgroundColor);
            };
            //(private)change DOM visibility style when visible is true or hidden
            this._change_visibility = function (visible) {
                this.node.set_visibility(!!visible ? "visible" : "hidden");
            };
        };
        return data;
    };
    //9.刷新(指定頁)切頁元件
    this.refresh_specifiedPageControl = function (context) {
        const main = this;
        const ctx = context || main.pageControlRootNode.getContext('2d');
        for (var index = 0; index < main.pageControl.specifiedPageList.length; index++) {
            //refresh specified page object
            main.pageControl.specifiedPageList[index].node.translate_and_refresh_textContent(ctx);
        }
    };
    //刷新指定頁的pageIndex屬性
    this.refresh_specifiedPageControl_pageIndex = function (pageIndex) {
        const main = this;
        const ctx = main.pageControlRootNode.getContext('2d');
        const maxPage = (main.refinedData.length - 1);    //取得自定資料物件的最大頁數値
        const last_digit_ten = Math.floor((main.currentPage - 1) / 10);
        const digit_ten = Math.floor((pageIndex - 1) / 10);     //取得頁的非個位數的値(ex: 第10頁 => 0,第11頁 => 1)
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
                    current.node.refresh_textContent(ctx);
                }
                else {
                    current.set_pageIndex("");
                    current.node.set_visibility('hidden');
                    current.node.refresh_textContent(ctx);
                }
            });
        }
        //取消前一次指定頁的select屬性與背景色
        main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(false);
        //變完背景色後刷新一下舊的
        main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].node.refresh_textContent(ctx);
        //設定當前頁
        main.currentPage = pageIndex;
        //設定當前指定頁的slect屬性與背景色
        main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(true);
        //變完背景色後刷新一下新的
        main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].node.refresh_textContent(ctx);
        //刷新顯示資料
        main.display_data(main.currentPage);
        //刷新排序元件
        main.refresh_columnSortNode();
        //刷新silder bar
        main.refresh_slider();
    };
    //10.將指定頁物件的node部分(cell_canvas)抽出丟入切頁搜尋列表
    this.add_searchList_specifiedPageControl = function () {

        const main = this;
        //抽出Cell_canvas物件的部分
        const specifiedArr = main.pageControl.specifiedPageList.map(function (object) {
            return object.node;
        });
        //console.log('increment List', incrementArr);
        //把Cell物件的陣列集合丟入切頁搜尋列表
        main.pageSearchPriorityList.push(specifiedArr);
        /*
        var main = this,
            currentIndex = 0,
            tmpCurrentPageIndex = 0;
        main.pageControl.specifiedPageList.forEach(function (current, index, array) {
            current.node.onclick = function (e) {
                //取消上次指定頁物件的select屬性並還原背景色
                main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(false);

                //設定觸發click事件的物件索引
                currentIndex = index;
                tmpCurrentPageIndex = current.pageIndex;//取得物件內page屬性的值
                console.log("page click: " + currentIndex, 'Control object PageIndex:', current.pageIndex);
                main.currentPage = tmpCurrentPageIndex;//變更主物件的當前頁屬性値
                main.display_data(main.currentPage);//依據頁値刷新顯示資料
                main.pageControl.specifiedPageList[(main.currentPage - 1) % 10].set_select(true);//變更本次指定頁物件的select屬性並變更背景色
            }
        });
        */
    };
    //計算遞增(遞減)型元件切頁
    this.click_page = function (obj) {
        const main = this;
        if (typeof (obj.type) !== 'string') {
            throw TypeError('[click_page]Error: obj.type is not string:' + typeof (obj.type));
        }
        switch (obj.type) {
            case "min":
                    //刷新指定頁面數據
                    main.refresh_specifiedPageControl_pageIndex(1);             
                    //console.log('切頁:min');
                break;
            case "-10":
                    var currentPage = ((main.currentPage - 10) >= 1) ? (main.currentPage - 10) : 1;
                    main.refresh_specifiedPageControl_pageIndex(currentPage);
                    //console.log('切頁: -10');
                break;
            case "-1":
                    var currentPage = ((main.currentPage - 1) >= 1) ? (main.currentPage - 1) : 1;
                    main.refresh_specifiedPageControl_pageIndex(currentPage);
                    //console.log('切頁: -1');
                break;
            case "+1":
                    var currentPage = ((main.currentPage + 1) <= (main.refinedData.length - 1)) ? (main.currentPage + 1) : (main.refinedData.length - 1);
                    //console.log('+1', currentPage);
                    main.refresh_specifiedPageControl_pageIndex(currentPage);
                    //console.log('切頁: +1');
                break;
            case "+10":
                    var currentPage = ((main.currentPage + 10) <= (main.refinedData.length - 1)) ? (main.currentPage + 10) : (main.refinedData.length - 1);
                    main.refresh_specifiedPageControl_pageIndex(currentPage);
                    //console.log('切頁: +10');
                break;
            case "max":
                    var currentPage = (main.refinedData.length - 1);
                    main.refresh_specifiedPageControl_pageIndex(currentPage);
                    //console.log('切頁:max');
                    break;
            case "specified_page":
                var currentPage = main.pageControl.specifiedPageList[obj.index].pageIndex;
                main.refresh_specifiedPageControl_pageIndex(currentPage);
                //console.log('指定切頁', main.pageControl.specifiedPageList[obj.index].pageIndex);
                break;
            default:
                throw Error('[click_page]Error: type not defined => ' + typeName);
        }
    };
    /*
        數據注入公用方法
    */
    //json data load and refine data for table format
    this.JsonDataLoad = function (JsonData, refinedFunc) {
        const that = this;
        var data;
        if (!!JsonData) {
            data = (!!refinedFunc) ? refinedFunc(JsonData) : JsonData;//if has refine function then call it or just origin JSON
            that.data.push(data);
            that.dataIndex += 1;//目前所使用的厡始資料索引
            that.refine_JsonData(data);//將注入資料轉換成自訂格式物件(即refinedData[頁][欄][列])
            that.currentPage = 1;//定義當前頁屬性為第1頁
            that.display_data(that.currentPage);//使用自定格式物件刷新頁面
            that.pageControl.specifiedPageList[that.currentPage - 1].set_select(true);//變更指定頁物件的select屬性並變更背景
            that.refresh_specifiedPageControl();
            that._refresh_columnSortName();//
            that.refresh_columnSortNode();
            //頁狀態物件的元素屬性(node => DOM)
            that.pageControl.incrementPageList[3].node.textContent = that.currentPage + "/" + (that.refinedData.length - 1);
        }
    };
    /*
        數據元件
    */
    //重新定義輸入的數據轉成自訂格式 => [頁][欄][列] => 數據
    this.refine_JsonData = function (jsonData) {
        if (jsonData instanceof Array) {
            const that = this;
            const everyRowCount = this.row - 1;//every page include header in row 0 so minus 1
            var currentPage;
            var columnIndex;
            var currentRowIndex;
            var refinedData = that.refinedData = [];

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
                        //console.log(refinedData[currentPage][columnIndex]);
                    }
                    refinedData[currentPage][columnIndex].push(currentObj[propertyName]);
                    columnIndex++;
                }
            });
            //console.log('refined array', this.refinedData);//[page][column][row] => page:[column:[row:[]]]
        }
    };
    //數據寫入顯示元素
    this.display_data = function (pageIndex) {
        const main = this;
        for (var columnIndex = 0; columnIndex < main.refineNodeTable.length; columnIndex++) {
            for (var rowIndex = 0; rowIndex < main.refineNodeTable[columnIndex].length; rowIndex++) {
                //console.log("順序", main.columnSequence[columnIndex], main.refinedData[pageIndex][main.columnSequence[columnIndex]][rowIndex]);
                //欄位資料依據欄位陣列順序排列
                main.refineNodeTable[columnIndex][rowIndex].set_textContent(main.refinedData[pageIndex][main.columnSequence[columnIndex]][rowIndex] || "");
            }
        }
        //刷新Grid的顯示元件
        main.refresh_allDisplayElement();
    };
    /*
        欄位數據交換
    */
    //11.新增header類別的元件進入grid定位搜尋列表--欄與欄資料交換
    this.add_headersToSeachList = function(){
        const main = this;
        //get header cell array
        var headers = main.refineNodeTable.map(function(arr){
            if(arr[0].type === 'header'){
                return arr[0];//return header cell object
            }
        });//(arr=>{console.log(arr[0]);return arr[0];});
        //console.log('headers',headers);
        //add to grid search list
        main.gridSearchPriorityList.push(headers);
    };
    //(私)物件屬性値交換
    this._swap = function (ary, a, b) {
        var tmp = ary[a];
        ary[a] = ary[b];
        ary[b] = tmp;
    };
    /*
        欄位排序元件
    */
    //12.建立欄位排序元件
    this.createSortNodeList = function () {
        const main = this;
        const type = 'column_sort';
        const backgroundColor = 'red';
        const shape_direction = false;
        const cell_height = (main.rowHeight / 2) >> 0;
        var tmp_Node;//cell object
        var tmp_Object;//outside object
        var settings;
        
        //create column sort elements
        for (var index = 0; index < main.column; index++) {
            //1.新增排序元件的基本形狀屬性(正三角)
            settings = new Settings_RegularTriangle(main.ResizeBarNodeList[index].settings.x - 18, cell_height, 10, shape_direction);
            //2.新增排序元件
            tmp_Node = new RegularTriangle(type, index, settings, type, backgroundColor);
            //加入排序屬性陣列
            main.columnSortNodeList.push(tmp_Node);
            //加入縮放元件的子陣列屬性
            main.ResizeBarNodeList[index].set_childrenArray(tmp_Node);
        }
        //console.log('[ResizeBarNodeList]', main.ResizeBarNodeList);
    };
    //(私)數據注入時,刷新columnSortName屬性值(設定欄位資料種類)
    this._refresh_columnSortName = function () {
        var main = this,
            dataType =// ['number', 'number', 'number', 'number', 'number'];   //kai的json數據
        ['number', 'date', 'string', 'string', 'string'];  //借來的json數據
        main.columnSortNodeList.forEach(function (currentElement, index, array) {
            //新增排序元件屬性(欄位名稱)
            currentElement.columnSortName = main.refineNodeTable[main.columnSequence[index]][0].textContent;//取得json物件的屬性名稱(當排序的依據條件)
            //設定欄位資料種類(排序時的依據)
            currentElement.dataType = dataType[index];
        });
    };
    //13.刷新所有排序欄位元素的CSS或指定的CSS屬性
    this.refresh_columnSortNode = function () {
        const main = this;
        const ctx = main.gridElement.getContext('2d');
        //設定所有縮放元素,若有指定起始index則取指定値當起始値
        for (var index = 0; index < main.columnSortNodeList.length; index++) {
            main.columnSortNodeList[index].draw(ctx);
        }
    };
    //14.欄位排序元素元件進入grid定位搜尋列表
    this.add_columnSortNodesToSeachList = function () {
        const main = this;
        //console.log('columnSortNodeList', main.columnSortNodeList);
        main.gridSearchPriorityList.push(main.columnSortNodeList);
    };
    //(私)依選擇的物件排序欄位
    this._sort_column = function (selectObject) {
        const main = this; 
        //if(Object.hasOwnProperty())
        //if((typeof selectObject) === 'object' && selectObject.hasOwnProperty('columnSortName') && selectObject.hasOwnProperty('dataType'))
        const sortName = selectObject.columnSortName;                    //排序的指定欄位名稱
        const dataType = selectObject.dataType;                          //排序的指定欄位資料格式
        const data = main.data[main.dataIndex];                          //排序的指定資料來源(原始數據)
        var newData;                                                     //排序完的新自訂資料物件[頁][欄][列]=>値
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
        //console.log('sorted', sortName);
        //重新刷新指定頁物件並回到第一頁
        main.refresh_specifiedPageControl_pageIndex(1);
        //main.pageControl.specifiedPageList[(main.currentPage - 1) % 10]
        //main.pageControl.incrementPageList[3].node.set_textContent(main.currentPage + "/" + (main.refinedData.length - 1));
        //console.log('sorted', main.refinedData);
    };
    //(私)排序元件的屬性(欄位名稱與資料格式)交換
    this._swap_columnSortNode_sortName = function (index1, index2) {
        const main = this;
        var tmpColumnSortName;
        var tmpDataType;
        //交換欄位名稱與資料格式資訊(排序用)
        tmpColumnSortName = main.columnSortNodeList[index1].columnSortName;
        tmpDataType = main.columnSortNodeList[index1].dataType;
        main.columnSortNodeList[index1].columnSortName = main.columnSortNodeList[index2].columnSortName;
        main.columnSortNodeList[index1].dataType = main.columnSortNodeList[index2].dataType;
        main.columnSortNodeList[index2].columnSortName = tmpColumnSortName;
        main.columnSortNodeList[index2].dataType = tmpDataType;
    };
    //快速排序法(被比較的陣列,比較的物件屬性,比較的數據類型)
    this.quickSort = function quick_Sort(ary, conditionName, type) {
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
                    //console.log(data1, data2, (new Date(data1).getTime()), (new Date(data2).getTime()));
                    compared = ((new Date(ary[i][conditionName]).getTime()) < (new Date(mid[0][conditionName]).getTime()));

                    break;
                    //數字比較
                case 'number'://((!isNaN(Number(ary[i][conditionName]))) && (!isNaN(Number(mid[0][conditionName])))):
                    compared = parseInt(ary[i][conditionName], 10) < parseInt(mid[0][conditionName], 10);
                    break;
                    /*
                    //字串比較(不比較字串,資料太多會stack over flow)
                case "string":
                    console.log('開始比較字串');
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
                //console.log(data1, data2, (new Date(data1).getTime()), (new Date(data2).getTime()));
                return ((Date.parse(data1)) < (Date.parse(data2)));
                //字串比較
            case "string":
                //字串1長度少於字串2
                if (data1.length < data2.length) {
                    return true;
                }
                    //字串1長度大於字串2
                else if (data1.length > data2.length) {
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
        canvas event setting
    */
    this.change_Cell_positionAndSize = function (index,forever) {
        const main = this;
        console.log('delegate Func', index, main);
        const selectedObj = main.ResizeBarNodeList[index];
        //變更指定索引Cell的width和其後面物件的位置[column]
        for (var i = index; i < main.refineNodeTable.length; i++) {
            if (i === index) {
                //變更寬度
                main.refineNodeTable[i].forEach(function (current) {
                    current.set_size(main.ResizeBarNodeList[index].tempSettings.x, main.ResizeBarNodeList[index].tempSettings.y, forever);
                });
            }
            else {
                //console.log("change position", i, main.ResizeBarNodeList[index].tempSettings.x, main.ResizeBarNodeList[index].tempSettings.y);
                //變更位置
                main.refineNodeTable[i].forEach(function (current) {
                    current.set_position(main.ResizeBarNodeList[index].tempSettings.x, main.ResizeBarNodeList[index].tempSettings.y, forever);
                });
            }
        }

        //refresh
        main.refresh_allDisplayElement();
    };
    //設定Resize元件要做的事
    this.set_task_resizeBar = function () {
        const main = this;
        main.ResizeBarNodeList.forEach(function (current) {
            //add task to resize bar
            //current.taskFuncList.push(main.change_Cell_positionAndSize);
        });
    }
    //資料顯示部分綁定事件(Closure)
    this.bind_event_grid = function () {
        const main = this;
        var ctx = main.gridElement.getContext('2d');
        var flag = false;
        var direction = false;//sort column shape(正三角/反三角)
        var selectedObject;
        var swapObject;
        var startX, startY, endX, endY;
        var sliderMoveRange;
        //畫面滑鼠按下定位
        main.gridElement.onmousedown = function (e) {
            e.stopPropagation();
            if (!flag && (flag = true)) {
                startX = e.offsetX || e.layerX;
                startY = e.offsetY || e.layerY;
                //依據座標檢查搜尋列表並回傳點擊的物件(沒找到則為undefined)
                selectedObject = main.searchObject(main.gridSearchPriorityList, startX, startY);
                console.log('mouse down startX', startX, 'startY', startY);
                console.log('selected object', selectedObject);
                //檢查選取的物件種類是否為header
                if (!!selectedObject && selectedObject.type === 'header') {
                    //change dom cursor
                    main.gridElement.style.cursor = "url('/Project/Grid/CSS/ICON/Drag_and_Drop-128.png'),default";
                    //變更透明度
                    selectedObject.set_opacity(0.5);
                    main.refresh_allDisplayElement();
                    main.refresh_columnSortNode();
                }
                //歸零
                sliderMoveRange = 0;
            }
        };//search object when mouse down 
        //畫面滑鼠移動事件
        main.gridElement.onmousemove = function (e) {
            e.stopPropagation();
            if (flag) {
                endX = e.offsetX || e.layerX;
                endY = e.offsetY || e.layerY;
                //
                if (!!selectedObject) {
                    switch (selectedObject.type) {
                        case "ResizeBar":
                            e.target.style.cursor = 'col-resize';
                            //最小範圍檢測,先取得物件的X位置資訊
                            if ((selectedObject.get_forwardRange() + (endX - startX)) < 20) {
                                main.ResizeBar_rangeList[selectedObject.name] = 20 - selectedObject.get_forwardRange();
                            }
                            else {
                                //紀錄移動間距
                                main.ResizeBar_rangeList[selectedObject.name] = endX - startX;
                            }
                            console.log("Resizer mouse move ...", main.ResizeBar_rangeList[selectedObject.name]);
                            selectedObject.set_position(main.ResizeBar_rangeList[selectedObject.name], 0, false, selectedObject.name);
                            break;
                        case "header":
                            swapObject = main.searchObject(main.gridSearchPriorityList, endX, endY);
                            if (!!swapObject && swapObject !== selectedObject && swapObject.type === 'header') {
                                main.gridSearchPriorityList.forEach(function (arr) {
                                    if (Array.isArray(arr) && arr[0].type === 'header') {
                                        arr.forEach(function (header) {
                                            header.set_backgroundColor('rgb(120, 207, 207)');
                                        });
                                    }
                                });
                                swapObject.set_backgroundColor('yellow');
                            }
                            break;
                        case 'sliderBar':
                            sliderMoveRange = endX - startX;
                            //取得slider的合法範圍
                            sliderMoveRange = main.sliderProportion.get_valid_position(sliderMoveRange);

                            //slider bar object
                            selectedObject.set_position(sliderMoveRange, 0, false, selectedObject.name);
                            //sliderMoveRange = Math.ceil((-sliderMoveRange + main.sliderProportion.bar.position) * main.sliderProportion.ratio);
                            //變更畫布translate位移量
                            main.refineNodeTable[0][0].translate.modify(Math.ceil(-(sliderMoveRange + main.sliderProportion.range.currentPosition) * main.sliderProportion.ratio), 0);//畫面和bar移動剛好相反
                            //main.ResizeBarNodeList[0].set_position(Math.ceil(-(sliderMoveRange /*+ main.sliderProportion.bar.position*/) * main.sliderProportion.ratio), 0, false, selectedObject.name);
                            console.log('slider range', sliderMoveRange);
                            break;
                        default:
                            break;
                    }
                    //清除整個Grid畫面並重畫所有元件
                    main.refresh_allDisplayElement();

                    main.refresh_slider();
                }
            }
        };//do selected object task
        //畫面滑屬上升事件
        main.gridElement.onmouseup = main.gridElement.onmouseleave = function (e) {
            e.stopPropagation();
            if (flag && !(flag = false)) {
                console.log('滑鼠閃人', selectedObject);
                e.target.style.cursor = "";
                if (!!selectedObject) {
                    switch (selectedObject.type) {
                        case "ResizeBar":
                            //確定變更後的值(若只是單純厡地click一下,值因沒有變動而變undefined)
                            if ((typeof main.ResizeBar_rangeList[selectedObject.name]) !== 'undefined') {
                                //1.header物件更新成永久變化的值
                                selectedObject.set_position(main.ResizeBar_rangeList[selectedObject.name], 0, true, selectedObject.name);
                                //2-1.更新slider Proportion範圍(抓resize bar最後一根的x軸位置)
                                main.sliderProportion.change_size(main.ResizeBarNodeList[4].settings.x);
                                //2-2.更新slider bar 寬度
                                //console.log('Slider bar', main.sliderProportion.bar.min);
                                main.slider_X_Bar.set_width(main.sliderProportion.bar.width);
                                //2-3 更新slider bar位置
                                main.slider_X_Bar.set_X(main.sliderProportion.range.currentPosition);
                                //
                                main.ResizeBar_rangeList[selectedObject.name] = 0;
                                //console.log("Resizer mouse up or out ...", main.ResizeBarNodeList[4].settings.x);//, selectedObject);
                            }
                            break;
                        case "column_sort":
                            console.log('Column Sort End', selectedObject);
                            //reset column sort shape
                            main.columnSortNodeList.forEach(function (obj) {
                                obj.settings.set_direction(false);//reset all shape from column sort object 
                            });//(obj)=>{obj.settings.set_direction(false);});
                            //sort column
                            direction = !direction;
                            selectedObject.settings.set_direction(direction);
                            main._sort_column(selectedObject);

                            break;
                        case 'header':
                            if (!!swapObject && swapObject !== selectedObject) {
                                //整欄交換
                                main._swap(main.columnSequence, selectedObject.columnIndex, swapObject.columnIndex);//交換起始與結束的索引順序
                                main._swap_columnSortNode_sortName(selectedObject.columnIndex, swapObject.columnIndex);//交換排序的欄位數據
                                //還原背景色與透明度
                                main.gridSearchPriorityList.forEach(function (arr) {
                                    if (Array.isArray(arr) && arr[0].type === 'header') {
                                        arr.forEach(function (header) {
                                            header.set_backgroundColor('rgb(120, 207, 207)');
                                        });
                                    }
                                });
                            }
                            selectedObject.set_opacity(1);
                            //更新數據
                            main.display_data(main.currentPage);
                            swapObject = null;
                            break;
                        case 'sliderBar':
                            //更新slider bar的永久位置
                            selectedObject.set_position(sliderMoveRange, 0, true, selectedObject.name);
                            //更新slider比例元件下bar的position屬性(sliderMoveRange:移動值)
                            main.sliderProportion.set_position(sliderMoveRange);
                            
                            break;
                        case 'sliderOuterFrame':
                            var translate_X_Value = main.sliderProportion.set_position(e.layerX);
                            //main.refineNodeTable[0][0].translate.modify(-translate_X_Value, 0);
                            console.log('要位移的trabslate值', translate_X_Value);
                            break;
                        default:
                            break;
                    }
                    
                    //清除Grid畫面並重畫所有元件(可忽略不做)
                    main.refresh_allDisplayElement();   //1.清除grid畫面並重繪cell物件
                    main.refresh_columnSortNode();      //2.重繪搜尋的三角型ICON
                    main.refresh_slider();              //3.重繪slider bar
                }
            }
        };//do selected object task
        //畫面移動並顯示滑鼠標誌事件
        main.gridElement.addEventListener('mousemove', function changeMouseCursor(e) {
            //若沒有選擇物件則隨者滑鼠移動變更cursor
            if (!flag) {
                e.stopPropagation();
                var tmpObject;
                //console.log('currentTarget', e.currentTarget);
                //"url('./CSS/ICON/Drag_and_Drop-128.png')";
                if (!!(tmpObject = main.searchObject(main.gridSearchPriorityList, (e.offsetX || e.layerX), (e.offsetY || e.layerY)))) {
                    switch (tmpObject.type) {
                        case 'ResizeBar':
                            main.gridElement.style.cursor = "col-resize";
                            break;
                        case 'column_sort':
                            main.gridElement.style.cursor = "pointer";
                            break;
                        default:
                            main.gridElement.style.cursor = "";
                    }

                }
                else {
                    main.gridElement.style.cursor = ""; //"";
                }
            }
        }, false);
    };
    //切頁元件綁定事件(Closure)
    this.bind_event_pageControl = function () {
        const main = this;
        const gridCTX = main.gridElement.getContext('2d');
        const pageCTX = main.gridElement.getContext('2d');
        //var flag = false;
        var selectedObject;
        //var startX, startY, endX, endY;
        main.pageControlRootNode.onclick = function (e) {
            e.stopPropagation();
            //依據座標檢查搜尋列表並回傳點擊的物件(沒找到則為undefined)
            selectedObject = main.searchObject(main.pageSearchPriorityList, e.layerX, e.layerY);
            //console.log('click', e.layerX, e.layerY, selectedObject);
            if(!!selectedObject){
                main.click_page(selectedObject);
            }
            
        };//search object when mouse click 
        main.pageControlRootNode.addEventListener('mousemove', function changeMouseCursor(e) {
            e.stopPropagation();
            //console.log('currentTarget', e.currentTarget);
            if (!!main.searchObject(main.pageSearchPriorityList, e.layerX, e.layerY)) {
                main.pageControlRootNode.style.cursor = "pointer";
            }
            else {
                main.pageControlRootNode.style.cursor = "";
            }
        }, false);//just change cursor
        
    };
    //遞迴檢查所有陣列中的陣列(若找到就回傳並離開遞迴搜尋)
    this.searchObject = function recursive(arr, x, y) {
        //console.log('testRecursive',that, x, y);
        
        if (Array.isArray(arr)) {
            for (var i = 0; i < arr.length; i++) {
                if (Array.isArray(arr[i])) {
                    //console.log('進入遞迴');
                    var result = recursive(arr[i], x, y);//不能使用const,會無法改變result,造成搜到底 
                    //找到就回傳物件
                    if (!!result) {
                        return result;
                    }
                }
                else {
                    //check coordinate
                    if (arr[i].hitCheck(x, y)) {
                        //console.log('誰符合條件', arr[i]);
                        return arr[i];
                    }
                    //else {
                    //    console.log('None');
                    //}
                }
            }
        }
    };
}

//
Grid.prototype.shared = new function Grid_prototype() {
    //建立DOM元素並設定class Name
    this.createElement = function (tagName, className) {
        const element = document.createElement(tagName);
        if (!!className) {
            element.classList.add(className);
        };
        return element;
    };
    this.createRect = function (x, y, width, height) {
        const rect = {};


    };
};

/*
    Component Part
*/
//triangle
var translate = new canvas_translate(0, 0);
function Triangle(name, index, settings, type, backgroundColor) {
    //名稱
    this.name = name;
    //索引
    this.index = index;
    //位置資訊(永久)
    this.settings = {
        x1: settings.x1,
        y1: settings.y1,
        x2: settings.x2,
        y2: settings.y2,
        x3: settings.x3,
        y3: settings.y3
    };
    //種類
    this.type = type;
    //位置資訊(暫時)
    this.tempSettings = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        x3: 0,
        y3: 0
    };
    //背景色
    this.backgroundColor = backgroundColor;
};
Triangle.prototype = new function Triangle_prototype(){
    //變更位置
    this.set_position = function (x, y, forever) {
        const that = this;
        //非永有改變
        if (!forever) {
            that.tempSettings.x1 = x;
            that.tempSettings.x2 = x;
            that.tempSettings.x3 = x;
            that.tempSettings.y1 = y;
            that.tempSettings.y2 = y;
            that.tempSettings.y3 = y;
        }
        else {
            that.settings.x1 += x;
            that.settings.x2 += x;
            that.settings.x3 += x;
            that.settings.y1 += y;
            that.settings.y2 += y;
            that.settings.y3 += y;
            that.tempSettings.x1 = 0;
            that.tempSettings.x2 = 0;
            that.tempSettings.x3 = 0;
            that.tempSettings.y1 = 0;
            that.tempSettings.y2 = 0;
            that.tempSettings.y3 = 0;
        }
    };
    //變更大小
    this.set_size = function (x, y, forever) {

    };
    //清除三角  TODO ... 有殘餘的邊
    this.clear =  function (ctx, color) {
        const that = this;
        that.draw(ctx, color);
    };
    //畫圖
    this.draw = function (ctx, color) {
        const that = this;
        ctx.save();
        ctx.fillStyle = color || that.color;
        ctx.beginPath();
        ctx.moveTo((that.settings.x1 +
                    that.tempSettings.x1),
                   (that.settings.y1 +
                    that.tempSettings.y1));
        ctx.lineTo((that.settings.x2 +
                   that.tempSettings.x2),
                   (that.settings.y2 +
                   that.tempSettings.y2));
        ctx.lineTo((that.settings.x3 +
                   that.tempSettings.x3),
                   (that.settings.y3 +
                   that.tempSettings.y1));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };
    //檢查是否在物件的範圍內
    this.hitCheck = function (x, y) {
        const that = this;
        //公式
        var a = (that.settings.x1 + that.tempSettings.x1) *
            ((that.settings.y2 + that.tempSettings.y2) -
             (that.settings.y3 + that.tempSettings.y3)) +
            (that.settings.x2 + that.tempSettings.x2) *
            ((that.settings.y3 + that.tempSettings.y3) -
             (that.settings.y1 + that.tempSettings.y1)) +
            (that.settings.x3 + that.tempSettings.x3) *
            ((that.settings.y1 + that.tempSettings.y1) -
             (that.settings.y2 + that.tempSettings.y2));
        var b = (that.settings.x1 - that.tempSettings.x1) *
            (y - (that.settings.y3 + that.tempSettings.y3)) +
            x * ((that.settings.y3 + that.tempSettings.y3) -
               (that.settings.y1 + that.tempSettings.y1)) +
            (that.settings.x3 + that.tempSettings.x3) *
            ((that.settings.y1 + that.tempSettings.y1) - y);
        var c = (that.settings.x1 - that.tempSettings.x1) *
            ((that.settings.y2 + that.tempSettings.y2) - y) +
            (that.settings.x2 + that.tempSettings.x2) *
            (y - (that.settings.y1 + that.tempSettings.y1)) +
            x * ((that.settings.y1 + that.tempSettings.y1) -
               (that.settings.y2 + that.tempSettings.y2));

        /* //未加變化量
        var a = that.settings.x1*(that.settings.y2 - that.settings.y3) + that.settings.x2*(that.settings.y3 - that.settings.y1) + that.settings.x3*(that.settings.y1 - that.settings.y2);
        var b = that.settings.x1*(y - that.settings.y3) + x*(that.settings.y3 - that.settings.y1) + that.settings.x3*(that.settings.y1 -y);
        var c = that.settings.x1*(that.settings.y2 - y) + that.settings.x2*(y - that.settings.y1) + x*(that.settings.y1 - that.settings.y2);
        */
        //條件
        if (((b + c) / a) < 1 && (b / a) > 0 && (c / a) > 0) {
            return true;
        }
        else {
            console.log('沒點到', a, b, c);
        }
    };
};
//Regular Triangle 正三角形(只要給x,y跟邊長)
function RegularTriangle(name, index, settings, type, backgroundColor) {
    //名稱
    this.name = name;
    //索引
    this.index = index;
    //位置資訊(永久)
    this.settings = settings;
    //種類
    this.type = type;
    //位置資訊(暫時)
    this.tempSettings = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        x3: 0,
        y3: 0
    };
    //背景色
    this.backgroundColor = backgroundColor;
};
RegularTriangle.prototype = new function RegularTriangle_prototype() {
    this.constructor = RegularTriangle;
    //變更位置
    this.set_position = function (x, y, forever) {
        const that = this;
        //非永有改變
        if (!forever) {
            that.tempSettings.x1 = x;
            that.tempSettings.x2 = x;
            that.tempSettings.x3 = x;
            that.tempSettings.y1 = y;
            that.tempSettings.y2 = y;
            that.tempSettings.y3 = y;
        }
        else {
            that.settings.x1 += x;
            that.settings.x2 += x;
            that.settings.x3 += x;
            that.settings.y1 += y;
            that.settings.y2 += y;
            that.settings.y3 += y;
            that.tempSettings.x1 = 0;
            that.tempSettings.x2 = 0;
            that.tempSettings.x3 = 0;
            that.tempSettings.y1 = 0;
            that.tempSettings.y2 = 0;
            that.tempSettings.y3 = 0;
        }
    };
    //畫布位移用的參數(執行modify方法一次則全部背new出來的物件全部一起變更)
    this.translate = translate;
    //變更大小
    this.set_size = function (x, y, forever) {

    };
    //清除三角  TODO ... 有殘餘的邊
    this.clear = function (ctx, color) {
        const that = this;
        that.draw(ctx, color);
    };
    //畫圖
    this.draw = function (ctx, color) {
        const that = this;
        ctx.save();
        ctx.fillStyle = color || that.backgroundColor;
        ctx.beginPath();
        ctx.moveTo((that.settings.x1 +
                    that.tempSettings.x1 + that.translate.x),
                   (that.settings.y1 +
                    that.tempSettings.y1));
        ctx.lineTo((that.settings.x2 +
                   that.tempSettings.x2 + that.translate.x),
                   (that.settings.y2 +
                   that.tempSettings.y2 ));
        ctx.lineTo((that.settings.x3 +
                   that.tempSettings.x3 + that.translate.x),
                   (that.settings.y3 +
                   that.tempSettings.y1));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };
    //畫布位移用的參數(執行modify方法一次則全部背new出來的物件全部一起變更)
    this.translate = translate;
    //檢查是否在物件的範圍內
    this.hitCheck = function (x, y) {
        const that = this;
        //公式
        var a = (that.settings.x1 + that.tempSettings.x1 + that.translate.x) *
            ((that.settings.y2 + that.tempSettings.y2) -
             (that.settings.y3 + that.tempSettings.y3)) +
            (that.settings.x2 + that.tempSettings.x2 + that.translate.x) *
            ((that.settings.y3 + that.tempSettings.y3) -
             (that.settings.y1 + that.tempSettings.y1)) +
            (that.settings.x3 + that.tempSettings.x3 + that.translate.x) *
            ((that.settings.y1 + that.tempSettings.y1) -
             (that.settings.y2 + that.tempSettings.y2));
        var b = (that.settings.x1 - that.tempSettings.x1 + that.translate.x) *
            (y - (that.settings.y3 + that.tempSettings.y3)) +
            x * ((that.settings.y3 + that.tempSettings.y3) -
               (that.settings.y1 + that.tempSettings.y1)) +
            (that.settings.x3 + that.tempSettings.x3 + that.translate.x) *
            ((that.settings.y1 + that.tempSettings.y1) - y);
        var c = (that.settings.x1 - that.tempSettings.x1 + that.translate.x) *
            ((that.settings.y2 + that.tempSettings.y2) - y) +
            (that.settings.x2 + that.tempSettings.x2 + that.translate.x) *
            (y - (that.settings.y1 + that.tempSettings.y1)) +
            x * ((that.settings.y1 + that.tempSettings.y1) -
               (that.settings.y2 + that.tempSettings.y2));

        /* //未加變化量
        var a = that.settings.x1*(that.settings.y2 - that.settings.y3) + that.settings.x2*(that.settings.y3 - that.settings.y1) + that.settings.x3*(that.settings.y1 - that.settings.y2);
        var b = that.settings.x1*(y - that.settings.y3) + x*(that.settings.y3 - that.settings.y1) + that.settings.x3*(that.settings.y1 -y);
        var c = that.settings.x1*(that.settings.y2 - y) + that.settings.x2*(y - that.settings.y1) + x*(that.settings.y1 - that.settings.y2);
        */
        //條件
        if (((b + c) / a) < 1 && (b / a) > 0 && (c / a) > 0) {
            return that;
        }
        //else {
        //    console.log('沒點到', a, b, c);
        //}
    };
};

//rectangle
function Rectangle(name, index, settings, type, backgroundColor, border) {
    //名稱
    this.name = name || "";
    //物件索引
    this.index = index;
    //永久的位置與寬高設置
    this.settings = new function () {
        if (!(settings instanceof Object)) {
            throw new TypeError("[settings]type not object" + settings.constructor);
        }
        this.x = settings.x;
        this.y = settings.y;
        this.width = settings.width;
        this.height = settings.height;
    };
    //存放暫時的位置與寬高設置
    this.tempSettings = new function() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    };
    //內縮的padding寬度
    this.border = border || 1;
    //背景顏色
    this.backgroundColor = backgroundColor;
    //種類
    this.type = type || "rectangle";
    //
    this.taskFuncList = [];
    //是否自動變更連動物件的位置資訊
    this.auto_changeNextObj = true;//false;
    //下一個物件指標
    this.nextObj;
    //前一個物件指標
    this.forwardObj;
    //子陣列指標
    this.childrenArray;
};
Rectangle.prototype = new function Rect_prototype(){
    //位置設置(包含子物件連動的部分) x:x軸變動量, y:y軸變動量, forever:是否永久變動, firstObjName:最初變動的物件名稱
    this.set_position = function (x, y, forever, firstObjName) {
        const that = this;
        const objectName = firstObjName;
        //非永久
        if (!forever) {
            that.tempSettings.x = x;
            that.tempSettings.y = y;
        }
        else {
            that.settings.x += x;
            that.settings.y += y;
            that.tempSettings.x = 0;//歸零
            that.tempSettings.y = 0;

        }
        //flag判定是否自動更新自身的子陣列與下一個連動的物件
        if (!!that.auto_changeNextObj) {
            //attatch on this object(this bar's children)
            if (Array.isArray(that.childrenArray) && that.childrenArray.length != 0) {
                //console.log("拖曳桿:", that.name, objectName);
                    that.childrenArray.forEach(function (current, index, arr) {
                        //是否為起始Resize bar
                        if (that.name === objectName) {
                            if (current.type === 'header' || current.type === 'cell') {
                                //拖曳物件的子陣列變更寬度
                                current.set_size(x, y, forever);
                            }
                            else {
                                //change column sort object position
                                current.set_position(x, y, forever);
                            }
                        }
                        else {
                            //拖曳物件後面連接的物件子陣列變更位置
                            current.set_position(x, y, forever);
                        }
                   });
            }
            //next object is exist
            if (!!that.nextObj) {
                //console.log('start change next object', that.nextObj.name);
                that.nextObj.set_position(x, y, forever, objectName);
            }
        }
    };
    //寬高設置
    this.set_size = function (x, y, forever) {
        const that = this;
        //非永久
        if (!forever) {
            that.tempSettings.width = x;
            that.tempSettings.height = y;
        }
        else {
            that.settings.width += x;
            that.settings.height += y;
            that.tempSettings.width = 0;//歸零
            that.tempSettings.height = 0;
        }
    };
    this.set_width = function (width) {
        const that = this;
        that.settings.width = width;
        //console.log(that.name + '變更width', that.settings.width);
    };
    //設定物件的X軸位置
    this.set_X = function (x) {
        const that = this;
        that.settings.x = x;
    };
    //畫布位移用的參數(執行modify方法一次則全部背new出來的物件全部一起變更)
    this.translate = translate;
    //設置下一個物件(原型:Rectangle)
    this.set_nextObj = function (obj){
        if (!(obj instanceof Rectangle)) {
            throw new TypeError('[set_nextObj] Error: param Type is not Rectangle');
        }
        this.nextObj = obj;
    };
    //設置前一個物件(原型:Rectangle)
    this.set_forwardObj = function(obj){
        if (!(obj instanceof Rectangle)) {
            throw new TypeError('[set_forwardObj] Error: param Type is not Rectangle');
        }
        this.forwardObj = obj;
    };
    //設置附屬於物件的陣列物件
    this.set_childrenArray = function (array) {
        const that = this;
        that.childrenArray = Array.isArray(that.childrenArray) ? that.childrenArray : [];
        that.childrenArray = that.childrenArray.concat(array);
    };
    //設置任務指標
    this.set_task = function(tasks){
        const that = this;
        for(var i = 0 ;i < arguments.length;i++){
            that.taskFuncList.push(arguments[i]);
        }
    };
    //與前一個物件的間距
    this.get_forwardRange = function(){
        const that = this;
        //forward obj is exist
        if (!!that.forwardObj) {
            //取得兩物件的間距
            return that.settings.x - that.forwardObj.settings.x;
        }
        else {
            return that.settings.x;
        }
    };
    //[棄用]clear rectangle(看起來要整個畫布清除了)
    this.clear = function (ctx) {
        const that = this;
        //not indefined
        if (!isNaN(that.settings.x + that.tempSettings.x +
                   that.settings.y + that.tempSettings.y +
                   that.settings.width + that.tempSettings.width +
                   that.settings.height + that.tempSettings.height)) {
            ctx.clearRect((that.settings.x + that.tempSettings.x),
                          (that.settings.y + that.tempSettings.y),
                          (that.settings.width + that.tempSettings.width),
                          (that.settings.height + that.tempSettings.width));
        }
        //console.log(that.x,that.y,that.width,that.height);
    };
    //畫圖
    this.draw = function (ctx, color) {
        const that = this;
        ctx.save();
        ctx.fillStyle = color || that.backgroundColor;
        ctx.fillRect((that.settings.x + that.tempSettings.x) /*+ that.border + that.translate.x*/,
                     (that.settings.y + that.tempSettings.y) /*+ that.border + that.translate.y*/,
                     (that.settings.width + that.tempSettings.width) - (that.border * 2),
                     (that.settings.height + that.tempSettings.height) - (that.border * 2));
        /* draw infonation */
        /*
        console.log('draw', ctx.fillStyle, (that.settings.x + that.tempSettings.x) + that.border,
            (that.settings.y + that.tempSettings.y) + that.border,
            (that.settings.width + that.tempSettings.width) - (that.border * 2),
            (that.settings.height + that.tempSettings.height) - (that.border * 2));
        */
        ctx.restore();
    };
    //檢查是否在物件的範圍內
    this.hitCheck = function (x, y) {
        const that = this;
        //判斷長方形範圍
        if (x > (that.settings.x + that.tempSettings.x + that.translate.x) &&
           x < (that.settings.x + that.tempSettings.x + that.translate.x + that.settings.width + that.tempSettings.width) &&
           y > (that.settings.y + that.tempSettings.y + +that.translate.y) &&
           y < (that.settings.y + that.tempSettings.y + that.translate.y + that.settings.height + that.tempSettings.height)) {
            return true;
        }
        return false;
    };
    //執行委派的任務並轉移指標到主物件
    this.run_task = function (main, index, flag) {
        const that = this;
        if (that.taskFuncList.length > 0) {
            that.taskFuncList.forEach(function (current) {
                current.call(main, index, flag);
            });
        }
    };
};

//長方形的表格單位格元件
function Cell_canvas(name,index) {
    if (arguments.length !== arguments.callee.length) {
        throw new Error("parameter must have " + arguments.callee.length);
    }
    this.name = name || "";
    //索引
    this.index = index;
    //種類
    this.type = 'none';//"header" : "body"
    //欄索引
    this.columnIndex;
    //列索引
    this.rowIndex; 
    //delegate function point
    this.taskFuncList = [];
    //selected
    this.selected = false;
    //永久的posiiton and width and height
    this.style = new function () {
        this.border;
        this.left;
        this.top;
        this.width;
        this.height;
        this.backgroundColor;
        this.visibility = 'visible';
        //opacity
        this.opacity = 1;
    };
    //臨時的posiiton and width and height
    this.tempStyle = new function () {
        this.left = 0;
        this.top = 0;
        this.width = 0;
        this.height = 0;
    };
    //文字內容
    this.textContent = "這是測試超過長度是否切除,超過長度的會被切掉";//"teste國234567890";
    //default font style
    this.font = new function () {
        this.color = "black",
        this.size = 16,
        this.unit = "px",
        this.typeface = "Calibri",
        this.textBaseline = "middle",
        this.textAlign = "left";
        this.indentRange = 5;//縮排距離
        this.string_width = 0;//文字寬度
    };
    //圖片路徑
    this.imagePath;
    //文字對齊方式('left':5 / 'center':依據文字寬度來計算 / 'right':依據文字寬度來計算)
    this.textAlign = 'left';
};
//Cell prototype function and default value
Cell_canvas.prototype = new function Cell_prototype() {
    /*
        default prototype value
    */
    //pseudo dom name
    this.name = "";
    //畫布位移用的參數(執行modify方法一次則全部背new出來的物件全部一起變更)
    this.translate = translate;
    //位置與大小的數據
    this.style = new function () {
        //寬度
        this.width = 0;
        //高度
        this.height = 0;
        //X axis
        this.left = 0;
        //Y axis
        this.top = 0;
        //border width
        this.border = 0;
        //background color
        this.backgroundColor = "yellow";
        //cursor style
        this.cursor = "default";
        //opacity
        this.opacity = 1;
    };
    //typeface and size setting
    this.font = new function () {
        this.color = "black";
        this.size = 15;
        this.unit = "px";
        this.typeface = "Calibri";
        this.textBaseline = "middle";
        this.textAlign = "left";
        this.indentRange = 0;//縮排距離
        this.string_width = 0;//文字寬度
    },
    //text
    this.textContent;
    /*
      draw function
    */
    //畫矩形(清除後再畫會內縮1px)
    this.draw_rect = function (ctx) {
        const that = this;
        //console.log('draw rectangle:' + this.name);
        //ctx.clearRect(this.style.left, this.style.top, this.style.width, this.style.height);
        //設定透明度(拖曳時的元件改變效果)
        if (that.style.opacity != 1) {
            ctx.globalAlpha = that.style.opacity;
        }
        ctx.fillStyle = that.style.backgroundColor;
        if ((that.style.left + that.style.border + that.tempStyle.left) < 0) {
            console.log('X軸為負值', (that.style.left + that.style.border + that.tempStyle.left));
        }
        ctx.fillRect((that.style.left + that.style.border + that.tempStyle.left),
            (that.style.top + that.style.border + that.tempStyle.top),
            (that.style.width - (that.style.border * 2) + that.tempStyle.width),
            (that.style.height - (that.style.border * 2) + that.tempStyle.height));
    };
    //清除矩形
    this.clear_rect = function (ctx) {
        const that = this;
        ctx.clearRect((that.style.left + that.tempStyle.left),
            (that.style.top + that.tempStyle.top),
            (that.style.width + that.tempStyle.width),
            (that.style.height + that.tempStyle.height));
    };
    //刷新矩型內的文字內容(先畫矩形再畫文字內容:依據style.visibility屬性値判斷是否顯示)
    this.refresh_textContent = function (ctx, text) {
        const that = this;
        that.set_textContent(text || that.textContent);
        if (that.style.visibility === 'visible') {
            //清除矩形並重畫矩形再重畫文字內容
            that.save_restore(ctx, that.clear_rect, that.draw_rect, that.draw_text);
        }
        else {
            //清除畫面
            that.save_restore(ctx, that.clear_rect);
        }
    };
    //刷新矩型內的圖片內容
    this.refresh_imageContent = function (ctx) {
        const that = this;
        if (that.style.visibility === 'visible') {
            //清除矩形並重畫矩形再重畫文字內容
            that.save_restore(ctx, that.clear_rect, that.draw_rect, that.draw_image);
        }
        else {
            //清除畫面
            that.save_restore(ctx, that.clear_rect);
        }
    };
    //檢查style.visibility屬性->位移畫布->畫矩形->寫字
    this.translate_and_refresh_textContent = function (ctx, text) {
        const that = this;
        that.set_textContent(text || that.textContent);
        //this.save_restore(ctx, this.clear_rect, this.translatePosition, this.draw_rect, this.draw_text);//清除矩形並重畫矩形再重畫文字內容
        if (that.style.visibility === 'visible') {
            that.save_restore(ctx, that.translatePosition, that.draw_rect, that.draw_text);//在最外面已清除畫面,所以就只需畫各個元件
        }
    };
    //畫文字內容
    this.draw_text = function (ctx) {
        //console.log("draw text:" + this.name);
        const that = this;
        var text = "";
        //設定透明度(拖曳時的元件改變效果)
        if (that.style.opacity != 1) {
            ctx.globalAlpha = that.style.opacity;
        }
        ctx.fillStyle = that.font.color;
        ctx.font = "" + that.font.size + that.font.unit + " " + that.font.typeface;//(字串)大小 + 單位 + 字體
        //檢查字串長度是否超出矩形寬度
        that.font.string_width = ctx.measureText(that.textContent).width;//Calculate string width
        //console.log("str:", String_Width, "width:", this.style.width);
        if (that.font.string_width > (that.style.width + that.tempStyle.width)) {
            var minus = that.textContent.length;//origin length
            var cutStr = "";//string temp
            //一直遞減一個字元,直到字串寬度小於矩形寬度
            while (that.font.string_width >= (that.style.width + that.tempStyle.width)) {
                minus--;//減少一個字元長度
                cutStr = that.textContent.slice(0, minus);//取得減少後的字串
                that.font.string_width = ctx.measureText(cutStr).width;//計算字串寬度(會依據font的size來算)
            }
            text = cutStr;
        }
        else {
            text = that.textContent;
        }
        ctx.textAlign = that.font.textAlign;//對齊左右
        ctx.textBaseline = that.font.textBaseline;//基準線設定
        //文字置中
        switch (that.textAlign) {
            case 'left':
                that.font.indentRange = 2;
                break;
            case 'center':
                that.font.indentRange = (that.style.width - that.font.string_width) / 2;
                break;
            case 'right':
                that.font.indentRange = (that.style.width - that.font.string_width) - 2;
                break;
            default:
                that.font.indentRange = 5;
        }
        //文字寫入
        ctx.fillText(text, (that.style.left + that.tempStyle.left + that.font.indentRange), (that.style.top + that.tempStyle.top + (that.style.height / 2)));
    };
    //paint image
    this.draw_image = function (ctx, imagePath) {
        const that = this;
        const img = new Image();
        const data = imagePath || that.imagePath;//若有輸入用輸入的或預設的
        img.onload = function draw(e) {
            //console.log("載入完成,開始畫圖", that.style.left, that.style.top, that.style.width, that.style.height);
            ctx.drawImage(img, that.style.left, that.style.top, that.style.width, that.style.height);
        };
        //看要不要判斷圖片路徑是否存在
        img.src = that.imagePath;
    };
    //畫布位移
    this.translatePosition = function (ctx, trans_x, trans_y) {
        var x = trans_x || this.translate.x;
        var y = trans_y || this.translate.y;
        if (x !== 0 || y !== 0) {
            console.log("執行位移", x, y);
            ctx.translate(x, y);
        }
    };
    //隔離畫布狀態並執行操作方法,操作方法指標依序帶入參數
    this.save_restore = function (ctx,args) {
        ctx.save();//產生新的stack隔離上次的Style設定
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i].constructor !== Function) {
                console.log("此參數非函式", arguments[i]);
                continue;
            }
            arguments[i].call(this, ctx);//因為再呼叫function時的this指到window了,所以這邊帶入當前的物件
        }
        ctx.restore();
    };
    //設定canvas translate位置的數據
    this.set_translate = function (x, y) {
        this.translate.modify(x, y);
    };
    //設定位置與大小資訊
    this.set_Style = function (x, y, width, height, backgroundColor, border) {
        const that = this;
        that.style.left = +x;
        that.style.top = +y;
        that.style.width = +width;
        that.style.height = +height;
        that.style.backgroundColor = backgroundColor;
        that.style.border = border;
    };
    //設定顏色
    this.set_backgroundColor = function (color) {
        this.style.backgroundColor = color;
    };
    //位置設置
    this.set_position = function (x, y, forever) {
        const that = this;
        //非永久
        if (!forever) {
            that.tempStyle.left = x;
            that.tempStyle.top = y;
        }
        else {
            that.style.left += x;
            that.style.top += y;
            that.tempStyle.left = 0;//歸零
            that.tempStyle.top = 0;
        }
    };
    //寬高設置
    this.set_size = function (tempWidth, tempHeight, forever) {
        const that = this;
        //非永久
        if (!forever) {
            that.tempStyle.width = tempWidth;
            that.tempStyle.height = tempHeight;
        }
        else {
            that.style.width += tempWidth;
            that.style.height += tempHeight;
            that.tempStyle.width = 0;//歸零
            that.tempStyle.height = 0;
        }
    };
    //設定文字風格
    this.set_fontStyle = function (color, size, unit, typeface, textBaseline, textAlign) {
        //依據Canvas的font 設定
        this.font.color = color || this.font.color;//ex:'red', 'rgb(0,0,0)', 'rgba(0,0,0,1)', '#ffffffff'
        this.font.size = +size || this.font.size; //number(自動轉10進位)
        this.font.unit = unit || this.font.unit;//文字單位 ex: px, pt, em, %,...
        this.font.typeface = typeface || this.font.typeface;//字體 ex: 'Cibrili', '標楷體'
        this.font.textBaseline = textBaseline || this.font.textBaseline;
        this.font.textAlign = textAlign || this.font.textAlign;
    };
    //設定文字內容
    this.set_textContent = function (text) {
        this.textContent = text;
    };
    //設定元件顯示/隱藏(visible/hidden)
    this.set_visibility = function (visible) {
        this.style.visibility = visible;
    };
    //設定文字置中
    this.set_align_center = function () {
        const that = this;
        that.font.indentRange = (that.style.width - that.font.string_width) / 2;
    };
    //設定種類與欄列資訊
    this.set_info = function(type,columnIndex,rowIndex){
        this.type = type;////column導向       //(Math.floor(elementIndex / this.column) == 0) ? "header" : "body"//row導向               
        this.columnIndex = columnIndex;//column導向            //(elementIndex % this.column),//列導向
        this.rowIndex = rowIndex;//column導向                    //Math.floor(elementIndex / this.column),  //row導向
    };
    //設定圖片路徑
    this.set_img_Path = function (path) {
        this.imagePath = path;
    };
    //設置任務指標
    this.set_task = function (tasks) {
        const that = this;
        for (var i = 0 ; i < arguments.length; i++) {
            that.taskFuncList.push(arguments[i]);
        }
    };
    //設定透明度
    this.set_opacity = function (opacity) {
        this.style.opacity = +opacity;
    }
    //檢查是否在物件的範圍內
    this.hitCheck = function (x, y){
        const that = this;
        //判斷長方形範圍
        if(x > (that.style.left + that.style.border + that.translate.x) && 
           x < ((that.style.left + that.style.border) + that.style.width + +that.translate.x) &&
           y > (that.style.top + that.style.border + +that.translate.y) &&
           y < ((that.style.top + that.style.border) + that.style.height) + +that.translate.y) {
            return true;
        }
        return false;
    };
    //執行委派的任務並轉移指標到主物件
    this.run_task = function (main, index) {
        const that = this;
        if (that.taskFuncList.length > 0) {
            that.taskFuncList.forEach(function (current) {
                current(index);
            }, main);
        }
    };
}
//translate當作共用的值(用來全部一起位移)
//用來設定canvas translate,只改一次,所有instance參考同一個値
function canvas_translate(x, y) {
    this.x = x;
    this.y = y;
};
//用來變更所有instance的値
canvas_translate.prototype.modify = function (x, y) {
    console.log("變更translate =>x:" + x + " y:" + y);
    this.x = +x;
    this.y = +y;
};
//**********************************************
//refine data to TaableManager
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
                    console.log('header', header);
                }
                else {
                    var obj = {};
                    for (var innerIndex = 0; innerIndex < data[outerIndex].length; innerIndex++) {
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
//正三角用的設定
function Settings_RegularTriangle(x, y, length, direction) {
    this.x1 = x;
    this.y1 = y;
    this.length = length;
    this.direction = !!direction ? 'positive' : 'negative';
    this.x2 = this._get_x2();
    this.y2 = this._get_y2();
    this.x3 = this._get_x3();
    this.y3 = this._get_y3();
    
};
Settings_RegularTriangle.prototype = new function () {
    //變更x1
    this.set_x1 = function (x1) {
        this.x1 = x1;
        this._set_x2();
        this._set_x3();
    };
    //變更y1
    this.set_y1 = function (y1) {
        this.y1 = y1;
        this._set_y2();
        this._set_y3();
    };
    this._get_x2 = function () {
        return this.x1 + this.length;
    };
    this._set_x2 = function () {
        this.x2 = this.x1 + this.length;
    };
    this._get_y2 = function () {
        return this.y1;
    };
    this._set_y2 = function () {
        this.y2 = this.y1;
    };
    this._get_x3 = function () {
        return this.x1 + (this.length / 2);
    };
    this._set_x3 = function () {
        this.x3 = this.x1 + (this.length / 2);
    };
    this._get_y3 = function () {
        const that = this;
        var y3;
        if (that.direction === 'positive') {
            y3 = that.y1 - Math.round((that.length / 2) * Math.sqrt(3));//y3的高(正三角) = y1 - 邊長 * 根號3
        }
        else {
            y3 = that.y1 + Math.round((that.length / 2) * Math.sqrt(3));//y3的高(反三角) = y1 + 邊長 * 根號3
        }
        return y3;
    };
    this._set_y3 = function () {
        const that = this;
        if (that.direction === 'positive') {
            that.y3 = that.y1 - Math.round((that.length / 2) * Math.sqrt(3));//y3的高(正三角) = y1 - 邊長 * 根號3
        }
        else {
            that.y3 = that.y1 + Math.round((that.length / 2) * Math.sqrt(3));//y3的高(反三角) = y1 + 邊長 * 根號3
        }
    };
    this.set_direction = function (isPositive) {
        if (!!isPositive) {
            this.direction = 'positive';
        }
        else {
            this.direction = 'negative';
        }
        this._set_y3();
    };
    //設定正或反三角並設定x1,y1位置
    this.set_info = function (isPositive, x1, y1) {
        const that = this;
        //
        that.set_direction(isPositive);
        that.set_x1(x1);
        that.set_y1(y1);
    };
};

/*
    Slider Component 計算比例的元件
    [Number]{origin_range}:原始寬度值
    [Number]{remap_max_range}:映射bar的最大固定寬度值
 */
function Proportion(index,type, origin_range, remap_max_range) {
    //物件索引
    this.index = index;
    //物件類別
    this.type = type || 'proportion';
    //原始値
    this.origin_val = origin_range;
    //變動値
    this.float_val;
    //上次的變動値
    this.last_float_val;
    //比例物件
    this.bar = new function () {
        this.max = remap_max_range;
        this.last_width = 0;
        this.width = remap_max_range;
    }
    //存放bar的最大値與最小値與當前位置( 0 ~ (bar.max-bar.width) )
    this.range = new function () {
        this.last_max = 0;
        //最大値
        this.max = 0;
        //最小值
        this.min = 0;
        //目前位置
        this.currentPosition = 0;
    };
    //變更範圍最大値 //需再補入委派的方法與物件
    this.change_size = function (new_float_val) {
        const that = this;
        //設定上次變動値
        that.last_float_val = that.float_val;
        //0.設定本次的變動寬度
        that.float_val = new_float_val;
        //1.設定bar新的width
        that._set_bar_width();
        //2.設定新的範圍最大値
        that._set_range_max();
        //3.刷新range current position
        that._refresh_position();
        //4.更新比例値
        that.ratio = that.get_ratio();
    };
    //暫時變動range位置(current position + deviation)
    this.get_valid_position = function (range) {
        const that = this;
        var tmp;
        if ((that.range.currentPosition + range) > that.range.max) {
            //console.log('1');
            return that.range.max - that.range.currentPosition;
        }
        else if ((that.range.currentPosition + range) < that.range.min) {
            //console.log('2');
            return -that.range.currentPosition;
        }
        else {
            //console.log('3');
            return /*that.range.currentPosition + */range;
        }
    }
    //永久變動range位置
    this.set_position = function (range) {
        const that = this;
        //超過最大範圍
        if ((that.range.currentPosition + range) > that.range.max) {
            that.range.currentPosition = that.range.max;
        }
            //低於最小範圍
        else if ((that.range.currentPosition + range) < that.range.min) {
            that.range.currentPosition = 0;
        }
        else {
            if (undefined === range) {
                console.error('range is undefined', range);
            }
            //累計變動
            that.range.currentPosition += range;
        }
    };
    //依據原始値與變更値取得比例値
    this.get_ratio = function () {
        const that = this;
        var ratio = that.float_val / that.origin_val;
        console.log('比例:', ratio, ' 浮動範圍:', that.float_val, ' 原始範圍:', that.origin_val);
        return ratio;
    };
    //設定bar新的width
    this._set_bar_width = function () {
        const that = this;
        //設定舊的width
        that.bar.last_width = that.bar.width;
        //更新 新的width //x1:y1 = x2:y2 => x2 = (x1*y2)/y1
        that.bar.width = Math.ceil((that.origin_val * that.bar.max) / that.float_val);
    };
    //設定新的範圍最大値
    this._set_range_max = function () {
        const that = this;
        //紀錄上一次的範圍最大値
        that.range.last_max = that.range.max;
        //設定新的範圍最大値
        that.range.max = that.bar.max - that.bar.width;
    };
    //刷新range current position(需要投影:projection)
    this._refresh_position = function () {
        const that = this;
        if (that.range.last_max == 0) {
            console.error("last range max 不得為 0", that.range.last_max);
            that.range.currentPosition = 0;
        }
        else {
            //(投影後)=> x(需要改變的currentPosition) + y(即變更後的新寬度) + z(與前一次的變動値差距/新的ratio) = (bar條的固定最大値)bar max
            //想法一: (bar max(固定的bar值) - (新的bar寬度) - (上一次變動值與本次變動值的差距/新的ratio)) * (上一次的位置/上次的範圍最大值)
            //that.range.currentPosition = Math.ceil((that.range.currentPosition / that.range.last_max) * (that.bar.max - that.bar.width - ((that.float_val - that.last_float_val) / that.get_ratio())));
            //想法二: 舊的畫面位移量 / 新的總寬度 = 比例bar的新的位置 / 比例bar的固定最大值 => 比例bar的新的位置 = (舊的畫面位移量 / 新的總寬度) * 比例bar的固定最大值
            that.range.currentPosition = ((that.range.currentPosition * that.ratio) / that.float_val) * that.bar.max;
        }
    };
};