// Heartfelt - by Martijn Steinrucken aka BigWings - 2017
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex0;
uniform float u_rainintensity;
uniform float u_speed;
uniform float u_brightness;
uniform float u_animate;
uniform float u_rainNormal;
uniform float u_rainZoom;
uniform vec3 u_overlayColor;
uniform float u_islighting; 
uniform float u_pp;
uniform float u_blur;
uniform float u_blurIterations;

#define S(a, b, t) smoothstep(a, b, t)
//#define CHEAP_NORMALS
//#define HAS_HEART
#define USE_POST_PROCESSING

vec3 N13(float p) {
    //  from DAVE HOSKINS
   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
   p3 += dot(p3, p3.yzx + 19.19);
   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

vec4 N14(float t) {
	return fract(sin(t*vec4(123., 1024., 1456., 264.))*vec4(6547., 345., 8799., 1564.));
}
float N(float t) {
    return fract(sin(t*12345.564)*7658.76);
}

float Saw(float b, float t) {
	return S(0., b, t)*S(1., b, t);
}


vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;
    
    uv.y += t*0.75;
    vec2 a = vec2(6., 1.);
    vec2 grid = a*2.;
    vec2 id = floor(uv*grid);
    
    float colShift = N(id.x); 
    uv.y += colShift;
    
    id = floor(uv*grid);
    vec3 n = N13(id.x*35.2+id.y*2376.1);
    vec2 st = fract(uv*grid)-vec2(.5, 0);
    
    float x = n.x-.5;
    
    float y = UV.y*20.;
    float wiggle = sin(y+sin(y));
    x += wiggle*(.5-abs(x))*(n.z-.5);
    x *= .7;
    float ti = fract(t+n.z);
    y = (Saw(.85, ti)-.5)*.9+.5;
    vec2 p = vec2(x, y);
    
    float d = length((st-p)*a.yx);
    
    float mainDrop = S(.4, .0, d);
    
    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x-x);
    float trail = S(.23*r, .15*r*r, cd);
    float trailFront = S(-.02, .02, st.y-y);
    trail *= trailFront*r*r;
    
    y = UV.y;
    float trail2 = S(.2*r, .0, cd);
    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
    y = fract(y*10.)+(st.y-.5);
    float dd = length(st-vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop+droplets*r*trailFront;
    
    //m += st.x>a.y*.45 || st.y>a.x*.165 ? 1.2 : 0.;
    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
	uv *= 40.;
    
    vec2 id = floor(uv);
    uv = fract(uv)-.5;
    vec3 n = N13(id.x*107.45+id.y*3543.654);
    vec2 p = (n.xy-.5)*.7;
    float d = length(uv-p);
    
    float fade = Saw(.025, fract(t+n.z));
    float c = S(.3, 0., d)*fract(n.z*10.)*fade;
    return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
    float s = StaticDrops(uv, t)*l0; 
    vec2 m1 = DropLayer2(uv, t)*l1;
    vec2 m2 = DropLayer2(uv*1.85, t)*l2;
    
    float c = s+m1.x+m2.x;
    c = S(.3, 1., c);
    
    return vec2(c, max(m1.y*l0, m2.y*l1));
}

	//random no.
	float N21(vec2 p) {
		p = fract(p*vec2(123.34, 345.45));
		p += dot(p, p + 34.345);
		return fract(p.x*p.y);
	}

void main()
{
 	vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
	vec2 UV = gl_FragCoord.xy/u_resolution.xy;//-.5;
    vec3 M = vec3(0);// iMouse.xyz/iResolution.xyz;
    float T = u_time+M.x*2.;
    
    #ifdef HAS_HEART
    T = mod(u_time, 102.);
    T = mix(T, M.x*102., M.z>0.?1.:0.);
    #endif
    
    
    float t = T*.2*u_speed;
    
    float rainAmount = u_rainintensity;//0.5;//iMouse.z>0. ? M.y : sin(T*.05)*.3+.7;
    
    float maxBlur = mix(3., 6., rainAmount);
    float minBlur = 2.;
    
    float story = 0.;
    float heart = 0.;
    
    #ifdef HAS_HEART
    story = S(0., 70., T);
    
    t = min(1., T/70.);						// remap drop time so it goes slower when it freezes
    t = 1.-t;
    t = (1.-t*t)*70.;
    
    float zoom= mix(.3, 1.2, story);		// slowly zoom out
    uv *=zoom;
    minBlur = 4.+S(.5, 1., story)*3.;		// more opaque glass towards the end
    maxBlur = 6.+S(.5, 1., story)*1.5;
    
    vec2 hv = uv-vec2(.0, -.1);				// build heart
    hv.x *= .5;
    float s = S(110., 70., T);				// heart gets smaller and fades towards the end
    hv.y-=sqrt(abs(hv.x))*.5*s;
    heart = length(hv);
    heart = S(.4*s, .2*s, heart)*s;
    rainAmount = heart;						// the rain is where the heart is
    
    maxBlur-=heart;							// inside the heart slighly less foggy
    uv *= 1.5;								// zoom out a bit more
    t *= .25;
    #else

    float zoom = -cos(T*.2)*u_animate;
    uv *= (.7+zoom*.3)*u_rainZoom;

    #endif
    //UV = (UV-.5)*(.9+zoom*.1)+.5;
    
    float staticDrops = S(-.5, 1., rainAmount)*2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);
    
    
    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
   #ifdef CHEAP_NORMALS
    	vec2 n = vec2(dFdx(c.x), dFdy(c.x));// cheap normals (3x cheaper, but 2 times shittier ;))
    #else
    	vec2 e = vec2(.001, 0.)*u_rainNormal;
    	float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
    	float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
    	vec2 n = vec2(cx-c.x, cy-c.x);		// expensive normals
    #endif
    
    
    #ifdef HAS_HEART
    n *= 1.-S(60., 85., T);
    c.y *= 1.-S(80., 100., T)*.8;
    #endif
    
    //float focus =  mix(maxBlur-c.y, minBlur, S(.1, .2, c.x));
    vec3 col = texture2D(u_tex0, UV+n).rgb;//, focus).rgb;
    vec4 texCoord = vec4(UV.x + n.x, UV.y + n.y, 0, 1.0 * 25. * 0.01 / 7.);

	if(u_blurIterations != 1.0)
	{
	    float blur = u_blur;
	    blur *= 0.01;
		float numSamples = u_blurIterations;
		float a = N21(gl_FragCoord.xy)*6.2831;
		for (int m = 0; m < 64; m++) {
			if(m > int(u_blurIterations))
				break;
			vec2 offs = vec2(sin(a), cos(a))* blur;
			float d = fract(sin((float(m) + 1.)*546.)*5424.);
			d = sqrt(d);
			offs *= d;
			col += texture2D(u_tex0,  texCoord.xy + vec2(offs.x,offs.y)).xyz;
			a++;
		}
		col /= numSamples;
	}
	
    #ifdef USE_POST_PROCESSING
    t = (T+3.)*.5;			// make time sync with first lightnoing
    if(int(u_pp) >= 1)				
    {			
	    float colFade = sin(t*.2)*.5+.5+story;
	    col *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade);	// subtle color shift
	}
    float fade = S(0., 10., T);							// fade in at the start
    
    if(int(u_islighting) >= 1)		
    {					
	    float lightning = sin(t*sin(t*10.));				// lighting flicker
	    lightning *= pow(max(0., sin(t+sin(t))), 10.);		// lightning flash
	    col *= 1.+lightning*fade*mix(1., .1, story*story);	// composite lightning
	}

    col *= 1.-dot(UV-=.5, UV)*u_pp;							// vignette
    											
    #ifdef HAS_HEART
    	col = mix(pow(col, vec3(1.2)), col, heart);
    	fade *= S(102., 97., T);
    #endif
    
    //col *= fade*u_overlayColor;	// composite start and end fade
    #endif
    
    gl_FragColor = vec4(col*u_brightness, 1);
}