/*
    虛擬DOM
*/
//模擬DOM紀錄DOM相關屬性値
var pseudoDOM = function (name, x, y, width, height, backgroundColor) {
    if (arguments.length !== 5) {
        throw new Error("parameter must have 5");
    }
    this.name = name || "";
    //CSS Style
    this.style = new function () {
        //都轉數字格式
        this.left = +x;
        this.top = +y;
        this.width = +width;
        this.height = +height;
        //背景顏色
        this.backgroundColor = backgroundColor || "#bbb";
        //鼠標符號
        this.cursor = "default";
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
    };
    //this.translate_X;
    //this.translate_Y;
    /*
        function
    */
    
}

pseudoDOM.prototype = {
    /*
        default prototype value
    */
    //pseudo dom name
    name: "",
    //畫布位移用的參數
    translate: new canvas_translate(0, 0),
    //translate_Y: 0,
    //位置與大小的數據
    style: {
        //寬度
        width: 0,
        //高度
        height: 0,
        //X axis
        left: 0,
        //Y axis
        top: 0,
        //background color
        backgroundColor: "yellow",
        //cursor style
        cursor: "default"
    },
    //typeface and size setting
    font: {
        color: "black",
        size: 15,
        unit: "px",
        typeface: "Calibri",
        textBaseline: "middle",
        textAlign: "left"
    },
    //text
    textContent: undefined,
    /*
      draw function
    */
    //畫矩形(清除後再畫會內縮1px)
    draw_rect: function (ctx) {
        //console.log('draw rectangle:' + this.name);
        //ctx.clearRect(this.style.left, this.style.top, this.style.width, this.style.height);
        ctx.fillStyle = this.style.backgroundColor;
        ctx.fillRect(this.style.left + 1, this.style.top + 1, this.style.width - 2, this.style.height - 2);
    },
    //清除矩形
    clear_rect:function(ctx){
        ctx.clearRect(this.style.left, this.style.top, this.style.width, this.style.height);
    },
    //刷新矩型內的文字內容(先畫矩形再畫文字內容)
    refresh_textContent:function(ctx, text){
        this.textContent = text || this.textContent;
        this.save_restore(ctx, this.clear_rect,this.draw_rect, this.draw_text);//清除矩形並重畫矩形再重畫文字內容
    },
    //清除畫布->位移畫布->畫矩形->寫字
    translate_and_refresh_textContent:function(ctx,text){
        this.textContent = text || this.textContent;
        this.save_restore(ctx, this.clear_rect,this.translatePosition,this.draw_rect, this.draw_text);//清除矩形並重畫矩形再重畫文字內容
    },
    //畫文字內容
    draw_text: function (ctx) {
        //console.log("draw text:" + this.name);
        var text = "";
        ctx.fillStyle = this.font.color;
        ctx.font = "" + this.font.size + this.font.unit + " " + this.font.typeface;//(字串)大小 + 單位 + 字體
        //檢查字串長度是否超出矩形寬度
        var String_Width = ctx.measureText(this.textContent).width;//Calculate string width
        //console.log("str:", String_Width, "width:", this.style.width);
        if (String_Width > this.style.width) {
            var minus = this.textContent.length;//origin length
            var cutStr = "";//string temp
            //一直遞減一個字元,直到字串寬度小於矩形寬度
            while (String_Width >= this.style.width) {
                minus--;//減少一個字元長度
                cutStr = this.textContent.slice(0, minus);//取得減少後的字串
                String_Width = ctx.measureText(cutStr).width;//計算字串寬度(會依據font的size來算)
            }
            text = cutStr;
        }
        else {
            text = this.textContent;
        }
        ctx.textAlign = this.font.textAlign;//對齊左右
        ctx.textBaseline = this.font.textBaseline;//基準線設定
        ctx.fillText(text, (this.style.left + 5), (this.style.top + (this.style.height / 2)));
    },
    //畫布位移
    translatePosition: function (ctx, trans_x, trans_y) {
        var x = trans_x || this.translate.x;
        var y = trans_y || this.translate.y;
        if (x !== 0 || y !== 0) {
            console.log("執行位移", x, y);
            ctx.translate(x, y);
        }
    },
    //隔離畫布狀態並執行操作方法,操作方法指標依序帶入參數
    save_restore: function (ctx) {
        ctx.save();//產生新的stack隔離上次的Style設定
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i].constructor !== Function) {
                console.log("此參數非函式", arguments[i]);
                continue;
            }
            arguments[i].call(this, ctx);//因為再呼叫function時的this指到window了,所以這邊帶入當前的物件
        }
        ctx.restore();
    },
    //設定canvas translate位置的數據
    set_translate: function(x, y){
        this.translate.modify(x, y);
    },
    //設定位置與大小資訊
    set_Style: function (x, y, width, height) {
        this.style.left = +x || this.style.left;
        this.style.top = +y || this.style.top;
        this.style.width = +width || this.style.width;
        this.style.height = +height || this.style.height;
    },
    //設定文字風格
    set_fontStyle: function (color, size, unit, typeface, textBaseline, textAlign) {
        //依據Canvas的font 設定
        this.font.color = color || this.font.color;//ex:'red', 'rgb(0,0,0)', 'rgba(0,0,0,1)', '#ffffffff'
        this.font.size = +size || this.font.size; //number(自動轉10進位)
        this.font.unit = unit || this.font.unit;//文字單位 ex: px, pt, em, %,...
        this.font.typeface = typeface || this.font.typeface;//字體 ex: 'Cibrili', '標楷體'
        this.font.textBaseline = textBaseline || this.font.textBaseline;
        this.font.textAlign = textAlign || this.font.textAlign;
    }
}
//translate當作共用的值(用來全部一起位移)
//用來設定canvas translate,只改一次,所有instance參考同一個値
function canvas_translate (x,y){
    this.x = x;
    this.y = y;
}
//用來變更所有instance的値
canvas_translate.prototype.modify = function (x, y) {
    //console.log("變更translate =>x:" + x + " y:" + y);
    this.x = +x;
    this.y = +y;
}
