import PortableReader from "../lib/readers/portable-reader";
import { RootDispatcher } from "../index";
import { getUser } from "../lib/users/users";

const init = (portableReader: PortableReader, dispatcher: RootDispatcher) => {
    portableReader.on('connectingStart', () => {
        dispatcher.sendEvent('onPortableReaderConnectingStart');
    });

    portableReader.on('connected', () => {
        dispatcher.sendEvent('onPortableReaderConnected');
    });

    portableReader.on('connectedFailed', (message: string) => {
        dispatcher.sendEvent('onPortableReaderConnectedFailed', message);
    });

    portableReader.on('tag', async (tag: string) => {
        const user = await getUser(tag);

        dispatcher.sendEvent('onPortableReaderTag', user);
    });

    portableReader.startListen();
};

export default init;