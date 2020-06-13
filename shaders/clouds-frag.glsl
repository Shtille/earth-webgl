precision highp float;

uniform sampler2D u_clouds_texture;

varying highp vec3 v_color;
varying highp vec3 v_attenuate;
varying highp vec2 v_texcoord;

void main()
{
	float cloudiness = texture2D(u_clouds_texture, v_texcoord).r;
	gl_FragColor = vec4(v_color + vec3(cloudiness) * v_attenuate, cloudiness);
}