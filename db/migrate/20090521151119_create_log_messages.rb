class CreateLogMessages < ActiveRecord::Migration
  def self.up
    create_table :log_messages do |t|
      t.references :player
      t.references :game
      t.string :text
			
      t.timestamp :created_at
    end
  end

  def self.down
    drop_table :log_messages
  end
end
