import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setConcurrency(2); // M1 8 Go : jamais plus, sinon swap
Config.setChromiumOpenGlRenderer("angle");
