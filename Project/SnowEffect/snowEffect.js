var Snow_Effect = function (max_width,max_height,max_particle) {
    //最大寬度
    this.max_width = max_width;
    //最大高度
    this.max_height = max_height;
    //max particle count
    this.max_particle = 25 || max_particle;
    //particle object collection
    this.particles = [];
    //snow color
    this.color = 'rgba(255,255,255,0.6)';
    //increament angle
    this.angle = 0;
    //canvas Context
    this.ctx;
    //init particle object collection
    this.init = function (ctx) {
        const main = this;
        // set canvas context
        main.ctx = ctx;
        //初始化雪的粒子集合
        for (var i = 0 ; i < main.max_particle; i++) {
            main.particles.push(
                new ParticleObj(Math.random() * main.max_width,
                Math.random() * main.max_height,
                Math.random() * 4 + 1,
                Math.random() * main.max_particle)
            );
        }
    };
    //更新粒子集合的狀態
    this.update = function () {
        const main = this;
        var particle;
        main.angle += 0.01;//遞增移動角度

        for (var i = 0; i < main.max_particle; i++) {
            particle = main.particles[i];

            particle.y += Math.cos(main.angle + particle.d) + 1 + (particle.r / 2);//
            particle.x += Math.sin(main.angle) * 2;
            //over flow the range
            if (particle.x > (main.max_width + 5) || particle.x < -5 || particle.y > main.max_height) {
                //
                if (i % 3 > 0) {
                    main.particles[i] = new ParticleObj(Math.random() * main.max_width, -10, particle.r, particle.d);
                }
                else {
                    //
                    if (Math.sin(main.angle) > 0) {
                        //改從右邊飄過去
                        main.particles[i] = new ParticleObj(-5, Math.random() * main.max_height, particle.r, particle.d);
                    }
                    else {
                        //改從左邊飄過去
                        main.particles[i] = new ParticleObj(main.max_width + 5, Math.random() * main.max_height, particle.r, particle.d);
                    }
                }
            }
        }
    };
    //執行
    this.draw = function (ctx) {
        const main = this;
        var particle;
        var ctx = main.ctx || ctx;
        //save state
        ctx.save();
        //clear canvas
        ctx.clearRect(0, 0, main.max_width, main.max_height);
        //set fill color
        ctx.fillStyle = main.color;
        //start paint
        ctx.beginPath();
        for (var i = 0; i < main.max_particle; i++) {
            particle = main.particles[i];
            ctx.moveTo(particle.x, particle.y);//移動到粒子的位置
            ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2, true);//畫出粒子
        }
        //fill color
        ctx.fill();
        //reset
        ctx.restore();
        //console.log('main', main);
        //update particle data
        main.update();
        //function call back
        window.requestAnimationFrame(function () { main.draw(ctx); });
    };
}

/*
 *    粒子物件原型
 */
function ParticleObj (x,y,radius,density){
    //x-coordinate
    this.x = x;
    //y-coordinate
    this.y = y;
    //particle radius
    this.r = radius;
    //密度//density
    this.d = density;
}