#include <iostream>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <SDL/SDL.h>

#ifdef EMSCRIPTEN
#include <emscripten.h>
#endif

#include "shaders.h"

using namespace std;

GLuint programObject;
SDL_Surface* screen;

GLfloat vVertices[] = {
	0.0f, 0.5f, 0.0f,
	-0.5f, -0.5f, 0.0f,
	0.5f, -0.5f, 0.0f
};
GLint uniformOriginX, uniformOriginY, uniformZoom;


extern "C" int initGL(int width, int height)
{
	//initialise SDL
	if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_TIMER) == 0) 
	{
		screen = SDL_SetVideoMode(width, height, 0, SDL_OPENGL);
		if (screen == NULL)
		{
			cerr << "Could not set video mode: " << SDL_GetError() << endl;
			return 0;
		}
	}
	else 
	{
		cerr << "Could not initialize SDL: " << SDL_GetError() << endl;
		return 0;
	}

	//SDL initialised successfully, now load shaders and geometry

	const char vertexShaderSource[] =
		"attribute vec4 vPosition;		                     \n"
		"uniform float originX, originY;                     \n"
		"uniform float zoom;                                 \n"
		"varying vec3 color;                                 \n"
		"void main()                                         \n"
		"{                                                   \n"
		"   gl_Position = vPosition;                         \n"
		"   gl_Position.x = (originX + gl_Position.x) * zoom;\n"
		"   gl_Position.y = (originY + gl_Position.y) * zoom;\n"
		"   color = gl_Position.xyz + vec3(0.5);             \n"
		"}                                                   \n";

	const char fragmentShaderSource[] =
		"precision mediump float;                     \n"
		"varying vec3 color;                          \n"
		"void main()                                  \n"
		"{                                            \n"
		"  gl_FragColor = vec4 ( color, 1.0 );        \n"
		"}                                            \n";

	//load vertex and fragment shaders
	GLuint vertexShader = loadShader(GL_VERTEX_SHADER, vertexShaderSource);
	GLuint fragmentShader = loadShader(GL_FRAGMENT_SHADER, fragmentShaderSource);
	programObject = buildProgram(vertexShader, fragmentShader, "vPosition");

	//save location of uniform variables
	uniformOriginX = glGetUniformLocation(programObject, "originX");
	uniformOriginY = glGetUniformLocation(programObject, "originY");
	uniformZoom = glGetUniformLocation(programObject, "zoom");

	glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
	//glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_FALSE);
	glViewport(0, 0, width, height);
	return 1;
}

extern "C" void drawTriangle(float *translation)
{
	//fill the screen with the clear color
	glClear(GL_COLOR_BUFFER_BIT);

	//enable our shader program
	glUseProgram(programObject);
	//set up the translation
	glUniform1f(uniformOriginX, translation[0]);
	glUniform1f(uniformOriginY, translation[1]);
	glUniform1f(uniformZoom, translation[2]);
	//set up the vertices array
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, vVertices);
	glEnableVertexAttribArray(0);
	//draw the triangle
	glDrawArrays(GL_TRIANGLES, 0, 3);

	//swap buffer to make whatever we've drawn to backbuffer appear on the screen
	SDL_GL_SwapBuffers();
}