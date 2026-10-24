import variables from 'config/variables';
import { Checkbox } from 'components/Form/Settings';
import { Text } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';

const VideoscapesSettings = () => {
  return (
    <Row final={true}>
      <Content
        title="Videoscapes"
        subtitle="Play a YouTube video silently as the background. Supports single videos or playlists (shuffled)."
      />
      <Action>
        <Checkbox
          name="videoscape"
          text="Enable Videoscape"
          element=".other"
        />
        <Text
          name="videoscapeUrl"
          title="YouTube URL or playlist link"
          placeholder="https://www.youtube.com/watch?v=... or playlist URL"
        />
      </Action>
    </Row>
  );
};

export default VideoscapesSettings;